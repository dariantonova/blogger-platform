import {inject, injectable} from "inversify";
import {LikesRepository} from "./likes.repository";
import {LikeDBType, LikeStatus} from "../../types/types";
import {Result} from "../../common/result/result.type";
import {ResultStatus} from "../../common/result/resultStatus";
import {LikesInfo} from "./likes.types";
import {CommentsRepository} from "../comments/comments.repository";

@injectable()
export class LikesService {
    constructor(
        @inject(LikesRepository) protected likesRepository: LikesRepository,
        @inject(CommentsRepository) protected commentsRepository: CommentsRepository,
    ) {}

    async makeLikeOperation(userId: string, parentId: string, likeStatus: LikeStatus): Promise<Result<null>> {
        const like = await this.likesRepository.findLikeByUserAndParent(userId, parentId);

        if (!like) {
            const createLikeResult = await this._createLike(userId, parentId, likeStatus);
            if (createLikeResult.status !== ResultStatus.SUCCESS) {
                return createLikeResult;
            }
        }
        else {
            const updateLikeResult = await this._updateLike(userId, parentId, likeStatus);
            if (updateLikeResult.status !== ResultStatus.SUCCESS) {
                return updateLikeResult;
            }
        }

        const updateRelatedEntityResult = await this.updateRelatedEntityLikesInfo(parentId);
        if (updateRelatedEntityResult.status !== ResultStatus.SUCCESS) {
            return updateRelatedEntityResult;
        }

        return {
            status: ResultStatus.SUCCESS,
            data: null,
            extensions: [],
        };
    };
    async _createLike(userId: string, parentId: string, status: LikeStatus): Promise<Result<null>> {
        const createdAt = new Date();
        const like = new LikeDBType(
            userId,
            parentId,
            status,
            createdAt,
        );

        await this.likesRepository.createLike(like);

        return {
            status: ResultStatus.SUCCESS,
            data: null,
            extensions: [],
        };
    };
    async _updateLike(userId: string, parentId: string, status: LikeStatus): Promise<Result<null>> {
        const isUpdated = await this.likesRepository.updateLike(userId, parentId, status);
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
    async updateRelatedEntityLikesInfo(likeParentId: string): Promise<Result<null>> {
        // call update likes info:
        // - comment
        // - post (later)
        const commentResult = await this._updateCommentLikesInfo(likeParentId);
        if (commentResult.status !== ResultStatus.SUCCESS) {
            return commentResult;
        }

        return {
            status: ResultStatus.SUCCESS,
            data: null,
            extensions: [],
        };
    };
    async _updateCommentLikesInfo(commentId: string): Promise<Result<null>> {
        const comment = await this.commentsRepository.findCommentById(commentId);
        if (!comment) {
            return {
                status: ResultStatus.SUCCESS,
                data: null,
                extensions: [],
            };
        }

        const likesCount = await this.likesRepository.countLikesOfParent(commentId);
        const dislikesCount = await this.likesRepository.countDislikesOfParent(commentId);
        const newLikesInfo: LikesInfo = {
            likesCount,
            dislikesCount,
        };

        const isLikesInfoUpdated = await this.commentsRepository
            .updateCommentLikesInfo(commentId, newLikesInfo);
        if (!isLikesInfoUpdated) {
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
    async deleteAllLikes() {
        return this.likesRepository.deleteAllLikes();
    };
}