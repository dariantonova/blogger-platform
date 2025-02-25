import {inject, injectable} from "inversify";
import {LikesRepository} from "./likes.repository";
import {LikeDBType, LikeStatus} from "../../types/types";
import {Result} from "../../common/result/result.type";
import {ResultStatus} from "../../common/result/resultStatus";
import {ExtendedLikesInfo, LikeDetails, LikesInfo} from "./likes.types";
import {CommentsRepository} from "../comments/comments.repository";
import {PostsRepository} from "../posts/repositories/posts.repository";
import {UsersRepository} from "../users/repositories/users.repository";

@injectable()
export class LikesService {
    constructor(
        @inject(LikesRepository) protected likesRepository: LikesRepository,
        @inject(CommentsRepository) protected commentsRepository: CommentsRepository,
        @inject(PostsRepository) protected postsRepository: PostsRepository,
        @inject(UsersRepository) protected usersRepository: UsersRepository,
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
        const commentResult = await this._updateCommentLikesInfo(likeParentId);
        if (commentResult.status !== ResultStatus.SUCCESS) {
            return commentResult;
        }
        const postResult = await this._updatePostExtendedLikesInfo(likeParentId);
        if (postResult.status !== ResultStatus.SUCCESS) {
            return postResult;
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
        const likesInfo: LikesInfo = {
            likesCount,
            dislikesCount,
        };

        const isLikesInfoUpdated = await this.commentsRepository
            .updateCommentLikesInfo(commentId, likesInfo);
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
    async _updatePostExtendedLikesInfo(postId: string): Promise<Result<null>> {
        const post = await this.postsRepository.findPostById(postId);
        if (!post) {
            return {
                status: ResultStatus.SUCCESS,
                data: null,
                extensions: [],
            };
        }

        const likesCount = await this.likesRepository.countLikesOfParent(postId);
        const dislikesCount = await this.likesRepository.countDislikesOfParent(postId);
        const numberOfNewestLikes = 3;
        const newestLikes = await this.likesRepository
            .findNewestLikesOfParent(postId, numberOfNewestLikes);
        let newestLikesDetails: LikeDetails[];
        try {
            newestLikesDetails = await Promise.all(newestLikes.map(this._mapLikeToLikeDetails.bind(this)));
        }
        catch (err) {
            return {
                status: ResultStatus.INTERNAL_SERVER_ERROR,
                data: null,
                extensions: [],
            };
        }

        const extendedLikesInfo: ExtendedLikesInfo = {
            likesCount,
            dislikesCount,
            newestLikes: newestLikesDetails,
        };

        const isLikesInfoUpdated = await this.postsRepository
            .updatePostExtendedLikesInfo(postId, extendedLikesInfo);
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
    async _mapLikeToLikeDetails(like: LikeDBType): Promise<LikeDetails> {
        const user = await this.usersRepository.findUserById(like.userId);
        if (!user) {
            throw new Error('Failed to find like user');
        }

        const login = user.login;
        return {
            addedAt: like.createdAt,
            userId: like.userId,
            login,
        };
    };
    async deleteAllLikes() {
        return this.likesRepository.deleteAllLikes();
    };
}