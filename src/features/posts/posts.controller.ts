import {Response} from 'express';
import {PostViewModel} from "./models/PostViewModel";
import {
    APIErrorResult,
    FieldError,
    Paginator,
    RequestWithBody,
    RequestWithParams,
    RequestWithParamsAndBody,
    RequestWithParamsAndQuery,
    RequestWithQuery
} from "../../types/types";
import {URIParamsPostIdModel} from "./models/URIParamsPostIdModel";
import {HTTP_STATUSES} from "../../utils";
import {CreatePostInputModel} from "./models/CreatePostInputModel";
import {UpdatePostInputModel} from "./models/UpdatePostInputModel";
import {PostsService} from "./posts.service";
import {QueryPostsModel} from "./models/QueryPostsModel";
import {PostsQueryRepository} from "./repositories/posts.query.repository";
import {getPostsQueryParamsValues, getQueryParamsValues} from "../../helpers/query-params-values";
import {CommentType, CommentViewModel, CreateCommentInputModel} from "../comments/comments.types";
import {CommentsService} from "../comments/comments.service";
import {ResultStatus} from "../../common/result/resultStatus";
import {resultStatusToHttp} from "../../common/result/resultStatusToHttp";
import {CommentsQueryRepository} from "../comments/comments.query.repository";
import {QueryCommentsModel} from "./models/QueryCommentsModel";
import {inject, injectable} from "inversify";
import {LikeInputModel} from "../likes/likes.types";

@injectable()
export class PostsController {
    constructor(
        @inject(PostsService) protected postsService: PostsService,
        @inject(PostsQueryRepository) protected postsQueryRepository: PostsQueryRepository,
        @inject(CommentsService) protected commentsService: CommentsService,
        @inject(CommentsQueryRepository) protected commentsQueryRepository: CommentsQueryRepository
    ) {}

    async getPosts(req: RequestWithQuery<QueryPostsModel>,
                    res: Response<Paginator<PostViewModel>>) {
        const userId = req.user ? req.user.id : null;
        const {
            sortBy,
            sortDirection,
            pageSize,
            pageNumber
        } = getPostsQueryParamsValues(req);

        const output = await this.postsQueryRepository.findPosts(
            sortBy, sortDirection, pageNumber, pageSize, userId
        );

        res.json(output);
    };
    async getPost(req: RequestWithParams<URIParamsPostIdModel>,
                   res: Response<PostViewModel>) {
        const userId = req.user ? req.user.id : null;
        const foundPost = await this.postsQueryRepository.findPostById(req.params.id, userId);
        if (!foundPost) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.json(foundPost);
    };
    async deletePost(req: RequestWithParams<URIParamsPostIdModel>, res: Response) {
        const isDeleted = await this.postsService.deletePost(req.params.id);
        if (!isDeleted) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    };
    async createPost(req: RequestWithBody<CreatePostInputModel>,
                      res: Response<PostViewModel | APIErrorResult>) {
        const createdPostId = await this.postsService.createPost(
            req.body.title, req.body.shortDescription, req.body.content, req.body.blogId
        );
        if (!createdPostId) {
            const fieldError = new FieldError(
                'blogId',
                'Blog does not exist');
            const errorResult = new APIErrorResult([fieldError]);

            res
                .status(HTTP_STATUSES.BAD_REQUEST_400)
                .json(errorResult);
            return;
        }

        const createdPost = await this.postsQueryRepository.findPostById(createdPostId, null);
        if (!createdPost) {
            res.sendStatus(HTTP_STATUSES.INTERNAL_SERVER_ERROR_500);
            return;
        }

        res
            .status(HTTP_STATUSES.CREATED_201)
            .json(createdPost);
    };
    async updatePost(req: RequestWithParamsAndBody<URIParamsPostIdModel, UpdatePostInputModel>,
                      res: Response<APIErrorResult>) {
        try {
            const isUpdated = await this.postsService.updatePost(
                req.params.id, req.body.title, req.body.shortDescription, req.body.content, req.body.blogId
            );
            if (!isUpdated) {
                res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
                return;
            }

            res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
        }
        catch (err) {
            const fieldError = new FieldError(
                'blogId',
                'Blog does not exist');
            const errorResult = new APIErrorResult([fieldError]);

            res
                .status(HTTP_STATUSES.BAD_REQUEST_400)
                .json(errorResult);
        }
    };
    async createPostComment(req: RequestWithParamsAndBody<{ postId: string }, CreateCommentInputModel>,
                             res: Response<CommentViewModel>) {
        const result = await this.commentsService.createComment(
            req.params.postId, req.user!.id, req.body.content
        );

        if (result.status !== ResultStatus.SUCCESS) {
            res.sendStatus(resultStatusToHttp(result.status));
            return;
        }

        const createdCommentId = result.data as string;
        const createdComment = await this.commentsQueryRepository
            .findCommentById(createdCommentId, null);
        if (!createdComment) {
            res.sendStatus(HTTP_STATUSES.INTERNAL_SERVER_ERROR_500);
            return;
        }

        res
            .status(HTTP_STATUSES.CREATED_201)
            .json(createdComment);
    };
    async getPostComments(req: RequestWithParamsAndQuery<{ postId: string }, QueryCommentsModel>,
                           res: Response<Paginator<CommentViewModel>>) {
        const userId = req.user ? req.user.id : null;
        const postId = req.params.postId;
        const {
            sortBy,
            sortDirection,
            pageNumber,
            pageSize,
        } = getQueryParamsValues(req);

        const result = await this.commentsService.getPostComments(
            postId, sortBy, sortDirection, pageNumber, pageSize
        );

        if (result.status !== ResultStatus.SUCCESS) {
            res.sendStatus(resultStatusToHttp(result.status));
            return;
        }

        const foundComments = result.data as CommentType[];
        const commentsOutput = await Promise.all(
            foundComments.map(c => this.commentsQueryRepository.mapBusinessEntityToOutput(c, userId)));

        const totalCount = await this.commentsQueryRepository.countPostComments(postId);
        const pagesCount = Math.ceil(totalCount / pageSize);

        const output = new Paginator<CommentViewModel>(
            commentsOutput,
            pagesCount,
            pageNumber,
            pageSize,
            totalCount
        );
        res.json(output);
    };
    async updatePostLikeStatus(req: RequestWithParamsAndBody<{ postId: string }, LikeInputModel>,
                               res: Response) {
        const postId = req.params.postId;
        const likeStatus = req.body.likeStatus;
        const user = req.user;

        if (!user) {
            res.sendStatus(HTTP_STATUSES.INTERNAL_SERVER_ERROR_500);
            return;
        }

        const result = await this.postsService.makePostLikeOperation(
            postId, user.id, likeStatus
        );
        if (result.status !== ResultStatus.SUCCESS) {
            res.sendStatus(resultStatusToHttp(result.status));
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    };
}