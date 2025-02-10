import {Result} from "../../common/result/result.type";
import {postsService} from "../posts/posts.service";
import {usersService} from "../users/users.service";
import {CommentatorInfo, CommentType} from "./comments.types";
import {commentsRepository} from "./comments.repository";
import {ResultStatus} from "../../common/result/resultStatus";
import {SortDirections} from "../../types/types";

class CommentsService {
    async createComment(postId: string, userId: string, content: string): Promise<Result<string | null>> {
        const post = await postsService.findPostById(postId);
        if (!post) {
            return {
                status: ResultStatus.NOT_FOUND,
                data: null,
                extensions: [],
            };
        }

        const user = await usersService.findUserById(userId);
        if (!user) {
            return {
                status: ResultStatus.UNAUTHORIZED,
                data: null,
                extensions: [],
            };
        }

        const commentatorInfo = new CommentatorInfo(user.id, user.login);
        const newCommentId = await commentsRepository.createComment(
            content,
            postId,
            commentatorInfo,
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
        const post = await postsService.findPostById(postId);
        if (!post) {
            return {
                status: ResultStatus.NOT_FOUND,
                data: null,
                extensions: [],
            };
        }

        const foundComments = await commentsRepository.findPostComments(
            postId, sortBy, sortDirection, pageNumber, pageSize
        );
        return {
            status: ResultStatus.SUCCESS,
            data: foundComments,
            extensions: [],
        }
    };
    async deleteAllComments() {
        await commentsRepository.deleteAllComments();
    };
    async deleteComment(commentId: string, currentUserId: string): Promise<Result<null>> {
        const comment = await commentsRepository.findCommentById(commentId);

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

        const isDeleted = await commentsRepository.deleteComment(commentId);
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
        const comment = await commentsRepository.findCommentById(commentId);

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

        const isUpdated = await commentsRepository.updateComment(commentId, content);
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

export const commentsService = new CommentsService();