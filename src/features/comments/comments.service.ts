import {Result} from "../../common/result/result.type";
import {PostsService} from "../posts/posts.service";
import {UsersService} from "../users/users.service";
import {CommentatorInfo, CommentType, LikesInfo} from "./comments.types";
import {CommentsRepository} from "./comments.repository";
import {ResultStatus} from "../../common/result/resultStatus";
import {SortDirections} from "../../types/types";
import {inject, injectable} from "inversify";

@injectable()
export class CommentsService {
    constructor(
        @inject(CommentsRepository) protected commentsRepository: CommentsRepository,
        @inject(PostsService) protected postsService: PostsService,
        @inject(UsersService) protected usersService: UsersService
    ) {}

    async createComment(postId: string, userId: string, content: string): Promise<Result<string | null>> {
        const post = await this.postsService.findPostById(postId);
        if (!post) {
            return {
                status: ResultStatus.NOT_FOUND,
                data: null,
                extensions: [],
            };
        }

        const user = await this.usersService.findUserById(userId);
        if (!user) {
            return {
                status: ResultStatus.UNAUTHORIZED,
                data: null,
                extensions: [],
            };
        }

        const commentatorInfo = new CommentatorInfo(user.id, user.login);
        const likesInfo: LikesInfo = { likesCount: 0, dislikesCount: 0 };
        const newCommentId = await this.commentsRepository.createComment(
            content,
            postId,
            commentatorInfo,
            likesInfo,
            new Date().toISOString()
        );
        return {
            status: ResultStatus.SUCCESS,
            data: newCommentId,
            extensions: [],
        }
    };
    async getPostComments(postId: string, sortBy: string, sortDirection: SortDirections,
                          pageNumber: number, pageSize: number): Promise<Result<CommentType[] | null>> {
        const post = await this.postsService.findPostById(postId);
        if (!post) {
            return {
                status: ResultStatus.NOT_FOUND,
                data: null,
                extensions: [],
            };
        }

        const foundComments = await this.commentsRepository.findPostComments(
            postId, sortBy, sortDirection, pageNumber, pageSize
        );
        return {
            status: ResultStatus.SUCCESS,
            data: foundComments,
            extensions: [],
        }
    };
    async deleteAllComments() {
        return this.commentsRepository.deleteAllComments();
    };
    async deleteComment(commentId: string, currentUserId: string): Promise<Result<null>> {
        const comment = await this.commentsRepository.findCommentById(commentId);

        if (!comment) {
            return {
                status: ResultStatus.NOT_FOUND,
                data: null,
                extensions: [],
            };
        }

        if (comment.commentatorInfo.userId !== currentUserId) {
            return {
                status: ResultStatus.FORBIDDEN,
                data: null,
                extensions: [],
            };
        }

        const isDeleted = await this.commentsRepository.deleteComment(commentId);
        if (!isDeleted) {
            return {
                status: ResultStatus.INTERNAL_SERVER_ERROR,
                data: null,
                extensions: [],
            };
        }

        return {
            status: ResultStatus.SUCCESS,
            data: null,
            extensions: [],
        };
    };
    async updateComment(commentId: string, currentUserId: string, content: string): Promise<Result<null>> {
        const comment = await this.commentsRepository.findCommentById(commentId);

        if (!comment) {
            return {
                status: ResultStatus.NOT_FOUND,
                data: null,
                extensions: [],
            };
        }

        if (comment.commentatorInfo.userId !== currentUserId) {
            return {
                status: ResultStatus.FORBIDDEN,
                data: null,
                extensions: [],
            }
        }

        const isUpdated = await this.commentsRepository.updateComment(commentId, content);
        if (!isUpdated) {
            return {
                status: ResultStatus.INTERNAL_SERVER_ERROR,
                data: null,
                extensions: [],
            };
        }

        return {
            status: ResultStatus.SUCCESS,
            data: null,
            extensions: [],
        };
    };
}