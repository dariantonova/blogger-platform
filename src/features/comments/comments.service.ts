import {Result} from "../../common/result/result.type";
import {postsService} from "../posts/posts.service";
import {usersService} from "../users/users.service";
import {CommentType} from "./comments.types";
import {commentsRepository} from "./comments.repository";
import {ResultStatus} from "../../common/result/resultStatus";
import {SortDirections} from "../../types/types";

export const commentsService = {
    async createComment(postId: string, userId: string, content: string): Promise<Result<string | null>> {
        // check post exists
        const post = await postsService.findPostById(postId);
        if (!post) {
            return {
                status: ResultStatus.NOT_FOUND,
                data: null,
            };
        }

        // check user exists
        const user = await usersService.findUserById(userId);
        if (!user) {
            return {
                status: ResultStatus.UNAUTHORIZED,
                data: null,
            };
        }

        // create comment
        const newComment: Omit<CommentType, 'id'> = {
            content,
            postId,
            commentatorInfo: {
                userId: user.id,
                userLogin: user.login,
            },
            createdAt: new Date().toISOString(),
        };

        const newCommentId = await commentsRepository.createComment(newComment);
        return {
            status: ResultStatus.SUCCESS,
            data: newCommentId,
        }
    },
    async getPostComments(postId: string, sortBy: string, sortDirection: SortDirections,
                          pageNumber: number, pageSize: number): Promise<Result<CommentType[] | null>> {
        // check post exists
        const post = await postsService.findPostById(postId);
        if (!post) {
            return {
                status: ResultStatus.NOT_FOUND,
                data: null,
            };
        }

        const foundComments = await commentsRepository.findPostComments(
            postId, sortBy, sortDirection, pageNumber, pageSize
        );
        return {
            status: ResultStatus.SUCCESS,
            data: foundComments,
        }
    },
};