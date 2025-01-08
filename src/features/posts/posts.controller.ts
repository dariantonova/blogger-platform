import {Response} from 'express';
import {PostViewModel} from "./models/PostViewModel";
import {
    Paginator,
    PostDBType,
    RequestWithBody,
    RequestWithParams,
    RequestWithParamsAndBody,
    RequestWithQuery
} from "../../types";
import {URIParamsPostIdModel} from "./models/URIParamsPostIdModel";
import {HTTP_STATUSES} from "../../utils";
import {CreatePostInputModel} from "./models/CreatePostInputModel";
import {UpdatePostInputModel} from "./models/UpdatePostInputModel";
import {postsService} from "./posts.service";
import {QueryPostsModel} from "./models/QueryPostsModel";
import {postsQueryRepository} from "./repositories/posts.query.repository";
import {getPostsQueryParamsValues} from "../../helpers/query-params-values";
import {validationResult} from "express-validator";

export const createPostsPaginator = async (items: PostDBType[], page: number, pageSize: number,
                                     pagesCount: number, totalCount: number): Promise<Paginator<PostViewModel>> => {
    const itemsViewModels: PostViewModel[] = await Promise.all(
        items.map(postsQueryRepository._mapToOutput)
    );

    return {
        pagesCount,
        page,
        pageSize,
        totalCount,
        items: itemsViewModels,
    };
};

export const postsController = {
    getPosts: async (req: RequestWithQuery<QueryPostsModel>,
                     res: Response<Paginator<PostViewModel>>) => {
        const {
            sortBy,
            sortDirection,
            pageSize,
            pageNumber
        } = getPostsQueryParamsValues(req);

        const validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
            const output: Paginator<PostViewModel> = {
                pagesCount: 0,
                page: 0,
                pageSize: 0,
                totalCount: 0,
                items: [],
            };
            res.json(output);
            return;
        }

        const output = await postsQueryRepository.findPosts(
            sortBy, sortDirection, pageNumber, pageSize
        );

        res.json(output);
    },
    getPost: async (req: RequestWithParams<URIParamsPostIdModel>, res: Response<PostViewModel>) => {
        const foundPost = await postsQueryRepository.findPostById(req.params.id);
        if (!foundPost) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.json(foundPost);
    },
    deletePost: async (req: RequestWithParams<URIParamsPostIdModel>, res: Response) => {
        const isDeleted = await postsService.deletePost(req.params.id);
        if (!isDeleted) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    },
    createPost: async (req: RequestWithBody<CreatePostInputModel>,
                 res: Response<PostViewModel>) => {
        const createdPost = await postsService.createPost(
            req.body.title, req.body.shortDescription, req.body.content, req.body.blogId
        );
        if (!createdPost) {
            res.sendStatus(HTTP_STATUSES.INTERNAL_SERVER_ERROR_500);
            return;
        }

        const postToSend = await postsQueryRepository._mapToOutput(createdPost);
        res
            .status(HTTP_STATUSES.CREATED_201)
            .json(postToSend);
    },
    updatePost: async (req: RequestWithParamsAndBody<URIParamsPostIdModel, UpdatePostInputModel>,
                 res: Response) => {
        const isUpdated = await postsService.updatePost(
            req.params.id, req.body.title, req.body.shortDescription, req.body.content, req.body.blogId
        );

        if (!isUpdated) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    },
};