import {Response} from 'express';
import {PostViewModel} from "./models/PostViewModel";
import {
    APIErrorResult,
    Paginator,
    PostDBType,
    RequestWithBody,
    RequestWithParams,
    RequestWithParamsAndBody, RequestWithParamsAndQuery,
    RequestWithQuery
} from "../../types/types";
import {URIParamsPostIdModel} from "./models/URIParamsPostIdModel";
import {HTTP_STATUSES} from "../../utils";
import {CreatePostInputModel} from "./models/CreatePostInputModel";
import {UpdatePostInputModel} from "./models/UpdatePostInputModel";
import {postsService} from "./posts.service";
import {QueryPostsModel} from "./models/QueryPostsModel";
import {postsQueryRepository} from "./repositories/posts.query.repository";
import {getPostsQueryParamsValues, getQueryParamsValues} from "../../helpers/query-params-values";
import {validationResult} from "express-validator";
import {CommentType, CommentViewModel, CreateCommentInputModel} from "../comments/comments.types";
import {commentsService} from "../comments/comments.service";
import {ResultStatus} from "../../common/result/resultStatus";
import {resultStatusToHttp} from "../../common/result/resultStatusToHttp";
import {commentsQueryRepository} from "../comments/comments.query.repository";
import {QueryCommentsModel} from "./models/QueryCommentsModel";

export const createPostsPaginator = async (items: PostDBType[], page: number, pageSize: number,
                                     pagesCount: number, totalCount: number): Promise<Paginator<PostViewModel>> => {
    const itemsViewModels: PostViewModel[] = await Promise.all(
        items.map(postsQueryRepository.mapToOutput)
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
    getPost: async (req: RequestWithParams<URIParamsPostIdModel>,
                    res: Response<PostViewModel>) => {
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
    createPostComment: async (req: RequestWithParamsAndBody<{ postId: string }, CreateCommentInputModel>,
                              res: Response<CommentViewModel>) => {
        const result = await commentsService.createComment(
            req.params.postId, req.user!.id, req.body.content
        );

        if (result.status !== ResultStatus.SUCCESS) {
            res.sendStatus(resultStatusToHttp(result.status));
            return;
        }

        const createdCommentId = result.data as string;
        const createdComment = await commentsQueryRepository.findCommentById(createdCommentId);
        if (!createdComment) {
            res.sendStatus(HTTP_STATUSES.INTERNAL_SERVER_ERROR_500);
            return;
        }

        res
            .status(HTTP_STATUSES.CREATED_201)
            .json(createdComment);
    },
    getPostComments: async (req: RequestWithParamsAndQuery<{ postId: string }, QueryCommentsModel>,
                            res: Response<Paginator<CommentViewModel>>) => {
        const postId = req.params.postId;
        const {
            sortBy,
            sortDirection,
            pageNumber,
            pageSize,
        } = getQueryParamsValues(req);

        const result = await commentsService.getPostComments(
            postId, sortBy, sortDirection, pageNumber, pageSize
        );

        if (result.status !== ResultStatus.SUCCESS) {
            res.sendStatus(resultStatusToHttp(result.status));
            return;
        }

        const foundComments = result.data as CommentType[];
        const commentsOutput = await Promise.all(
            foundComments.map(commentsQueryRepository.mapBusinessEntityToOutput));

        const totalCount = await commentsQueryRepository.countPostComments(postId);
        const pagesCount = Math.ceil(totalCount / pageSize);

        const output: Paginator<CommentViewModel> = {
            pagesCount,
            page: pageNumber,
            pageSize,
            totalCount,
            items: commentsOutput,
        };
        res.json(output);
    },
};