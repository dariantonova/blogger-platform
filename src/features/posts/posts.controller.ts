import {Response} from 'express';
import {PostViewModel} from "./models/PostViewModel";
import {
    APIErrorResult, FieldError,
    Paginator,
    PostDBType,
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
import {PostsQueryRepository, postsQueryRepository} from "./repositories/posts.query.repository";
import {getPostsQueryParamsValues, getQueryParamsValues} from "../../helpers/query-params-values";
import {CommentType, CommentViewModel, CreateCommentInputModel} from "../comments/comments.types";
import {CommentsService} from "../comments/comments.service";
import {ResultStatus} from "../../common/result/resultStatus";
import {resultStatusToHttp} from "../../common/result/resultStatusToHttp";
import {CommentsQueryRepository} from "../comments/comments.query.repository";
import {QueryCommentsModel} from "./models/QueryCommentsModel";

export const createPostsPaginator = async (items: PostDBType[], page: number, pageSize: number,
                                     pagesCount: number, totalCount: number): Promise<Paginator<PostViewModel>> => {
    const itemsViewModels: PostViewModel[] = await Promise.all(
        items.map(postsQueryRepository.mapToOutput)
    );

    return new Paginator<PostViewModel>(
        itemsViewModels,
        pagesCount,
        page,
        pageSize,
        totalCount
    );
};

class PostsController {
    private postsService: PostsService;
    private postsQueryRepository: PostsQueryRepository;
    private commentsService: CommentsService;
    private commentsQueryRepository: CommentsQueryRepository;
    constructor() {
        this.postsService = new PostsService();
        this.postsQueryRepository = new PostsQueryRepository();
        this.commentsService = new CommentsService();
        this.commentsQueryRepository = new CommentsQueryRepository();
    }

    async getPosts (req: RequestWithQuery<QueryPostsModel>,
                    res: Response<Paginator<PostViewModel>>) {
        const {
            sortBy,
            sortDirection,
            pageSize,
            pageNumber
        } = getPostsQueryParamsValues(req);

        const output = await this.postsQueryRepository.findPosts(
            sortBy, sortDirection, pageNumber, pageSize
        );

        res.json(output);
    };
    async getPost (req: RequestWithParams<URIParamsPostIdModel>,
                   res: Response<PostViewModel>) {
        const foundPost = await this.postsQueryRepository.findPostById(req.params.id);
        if (!foundPost) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.json(foundPost);
    };
    async deletePost (req: RequestWithParams<URIParamsPostIdModel>, res: Response) {
        const isDeleted = await this.postsService.deletePost(req.params.id);
        if (!isDeleted) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    };
    async createPost (req: RequestWithBody<CreatePostInputModel>,
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

        const createdPost = await this.postsQueryRepository.findPostById(createdPostId);
        if (!createdPost) {
            res.sendStatus(HTTP_STATUSES.INTERNAL_SERVER_ERROR_500);
            return;
        }

        res
            .status(HTTP_STATUSES.CREATED_201)
            .json(createdPost);
    };
    async updatePost (req: RequestWithParamsAndBody<URIParamsPostIdModel, UpdatePostInputModel>,
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
    async createPostComment (req: RequestWithParamsAndBody<{ postId: string }, CreateCommentInputModel>,
                             res: Response<CommentViewModel>) {
        const result = await this.commentsService.createComment(
            req.params.postId, req.user!.id, req.body.content
        );

        if (result.status !== ResultStatus.SUCCESS) {
            res.sendStatus(resultStatusToHttp(result.status));
            return;
        }

        const createdCommentId = result.data as string;
        const createdComment = await this.commentsQueryRepository.findCommentById(createdCommentId);
        if (!createdComment) {
            res.sendStatus(HTTP_STATUSES.INTERNAL_SERVER_ERROR_500);
            return;
        }

        res
            .status(HTTP_STATUSES.CREATED_201)
            .json(createdComment);
    };
    async getPostComments (req: RequestWithParamsAndQuery<{ postId: string }, QueryCommentsModel>,
                           res: Response<Paginator<CommentViewModel>>) {
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
            foundComments.map(this.commentsQueryRepository.mapBusinessEntityToOutput));

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
}

export const postsController = new PostsController();