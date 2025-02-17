import {inject, injectable} from "inversify";
import {CommentLikesRepository} from "./comment-likes.repository";
import {CommentsRepository} from "../comments.repository";
import {LikeOrDislike, LikeStatusEnum} from "../../../types/types";
import {Result} from "../../../common/result/result.type";
import {ResultStatus} from "../../../common/result/resultStatus";

const isLikeOrDislike = (likeStatus: any): likeStatus is LikeOrDislike => {
    return likeStatus !== LikeStatusEnum.none;
};

@injectable()
export class CommentLikesService {
    constructor(
        @inject(CommentLikesRepository) protected commentLikesRepository: CommentLikesRepository,
        @inject(CommentsRepository) protected commentsRepository: CommentsRepository
    ) {}

    async updateCommentLikeStatus(commentId: string, userId: string, likeStatus: LikeStatusEnum): Promise<Result<null>> {
        const comment = await this.commentsRepository.findCommentById(commentId);
        if (!comment) {
            return {
                status: ResultStatus.NOT_FOUND,
                data: null,
                extensions: [],
            };
        }

        const likeOperationResult = await this._makeCommentLikeOperation(commentId, userId, likeStatus);
        if (likeOperationResult.status !== ResultStatus.SUCCESS) {
            return {
                status: ResultStatus.INTERNAL_SERVER_ERROR,
                data: null,
                extensions: [],
            };
        }

        const likesCountUpdateResult = await this.updateCommentLikesCount(commentId);
        if (likesCountUpdateResult.status !== ResultStatus.SUCCESS) {
            return likesCountUpdateResult;
        }
        const dislikesCountUpdateResult = await this.updateCommentDislikesCount(commentId);
        if (dislikesCountUpdateResult.status !== ResultStatus.SUCCESS) {
            return dislikesCountUpdateResult;
        }

        return {
            status: ResultStatus.SUCCESS,
            data: null,
            extensions: [],
        };
    };
    async _makeCommentLikeOperation(commentId: string, userId: string, likeStatus: LikeStatusEnum): Promise<Result<null>> {
        if (!isLikeOrDislike(likeStatus)) {
            await this.commentLikesRepository.deleteCommentLikeByUserIdAndCommentId(userId, commentId);
            return {
                status: ResultStatus.SUCCESS,
                data: null,
                extensions: [],
            };
        }

        const updateInfo = await this.commentLikesRepository
            .updateCommentLikeStatus(userId, commentId, likeStatus);
        if (updateInfo.modified) {
            const isCreationDateUpdated = await this.commentLikesRepository
                .updateCommentLikeCreationDate(userId, commentId, new Date());
            if (!isCreationDateUpdated) {
                return {
                    status: ResultStatus.INTERNAL_SERVER_ERROR,
                    data: null,
                    extensions: [],
                };
            }
        }
        else if (!updateInfo.matched) {
            await this.commentLikesRepository.createCommentLike(
                userId, commentId, likeStatus, new Date()
            );
        }

        return {
            status: ResultStatus.SUCCESS,
            data: null,
            extensions: [],
        };
    };
    async updateCommentLikesCount(commentId: string): Promise<Result<null>> {
        const newLikesCount = await this.commentLikesRepository.countCommentLikes(commentId);
        const isCountUpdated = await this.commentsRepository.updateCommentLikesCount(commentId, newLikesCount);
        if (!isCountUpdated) {
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
    async updateCommentDislikesCount(commentId: string): Promise<Result<null>> {
        const newDislikesCount = await this.commentLikesRepository.countCommentDislikes(commentId);
        const isCountUpdated = await this.commentsRepository
            .updateCommentDislikesCount(commentId, newDislikesCount);
        if (!isCountUpdated) {
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
    async deleteAllCommentLikes() {
        return this.commentLikesRepository.deleteAllCommentLikes();
    };
}