import {Response} from 'express';
import {PostViewModel} from "./models/PostViewModel";
import {
    APIErrorResult,
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
                 res: Response<PostViewModel | APIErrorResult>) => {
        const createdPostId = await postsService.createPost(
            req.body.title, req.body.shortDescription, req.body.content, req.body.blogId
        );
        if (!createdPostId) {
            const error: APIErrorResult = {
                errorsMessages: [
                    {
                        message: 'Blog id does not exist',
                        field: 'blogId',
                    }
                ],
            };

            res
                .status(HTTP_STATUSES.BAD_REQUEST_400)
                .json(error);
            return;
        }

        const createdPost = await postsQueryRepository.findPostById(createdPostId);
        if (!createdPost) {
            res.sendStatus(HTTP_STATUSES.INTERNAL_SERVER_ERROR_500);
            return;
        }

        res
            .status(HTTP_STATUSES.CREATED_201)
            .json(createdPost);
    },
    updatePost: async (req: RequestWithParamsAndBody<URIParamsPostIdModel, UpdatePostInputModel>,
                 res: Response<APIErrorResult>) => {
        try {
            const isUpdated = await postsService.updatePost(
                req.params.id, req.body.title, req.body.shortDescription, req.body.content, req.body.blogId
            );
            if (!isUpdated) {
                res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
                return;
            }

            res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
        }
        catch (err) {
            const error: APIErrorResult = {
                errorsMessages: [
                    {
                        field: 'blogId',
                        message: 'Blog does not exist'
                    }
                ],
            };

            res
                .status(HTTP_STATUSES.BAD_REQUEST_400)
                .json(error);
        }
    },
};