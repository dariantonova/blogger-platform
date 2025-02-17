import {injectable} from "inversify";
import {CommentLikeDBType, LikeOrDislike} from "../../../types/types";
import {CommentLikeModel} from "../../../db/db";
import {UpdateCommentLikeInfo} from "../comments.types";

@injectable()
export class CommentLikesRepository {
    async createCommentLike(userId: string, commentId: string,
                            likeStatus: LikeOrDislike, createdAt: Date): Promise<string> {
        const commentLike = new CommentLikeDBType(
            userId,
            commentId,
            likeStatus,
            createdAt
        );
        const insertInfo = await CommentLikeModel.create(commentLike);
        return insertInfo._id.toString();
    };
    async deleteCommentLikeByUserIdAndCommentId(userId: string, commentId: string) {
        await CommentLikeModel.deleteOne({ userId, commentId });
    };
    async updateCommentLikeStatus(userId: string, commentId: string,
                                  likeStatus: LikeOrDislike): Promise<UpdateCommentLikeInfo> {
        const updateInfo = await CommentLikeModel
            .updateOne({ userId, commentId }, { likeStatus });
        const matched = updateInfo.matchedCount === 1;
        const modified = updateInfo.modifiedCount === 1;
        return { matched, modified };
    };
    async updateCommentLikeCreationDate(userId: string, commentId: string,
                                        createdAt: Date): Promise<boolean> {
        const updateInfo = await CommentLikeModel
            .updateOne({ userId, commentId }, { createdAt });
        return updateInfo.matchedCount === 1;
    };
    async countCommentLikes(commentId: string): Promise<number> {
        return CommentLikeModel.countDocuments({ commentId, likeStatus: LikeOrDislike.like });
    };
    async countCommentDislikes(commentId: string): Promise<number> {
        return CommentLikeModel.countDocuments({ commentId, likeStatus: LikeOrDislike.dislike });
    };
    async deleteAllCommentLikes() {
        await CommentLikeModel.deleteMany({});
    };
}