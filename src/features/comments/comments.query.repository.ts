import {CommentDBType, CommentType, CommentViewModel} from "./comments.types";
import {commentsCollection} from "../../db/db";
import {WithId} from "mongodb";

export const commentsQueryRepository = {
    async findCommentById(id: string): Promise<CommentViewModel | null> {
        const filterObj = { idDeleted: false, id };
        const comment = await commentsCollection.findOne(filterObj);
        return comment ? this.mapToOutput(comment) : null;
    },
    async mapToOutput(dbComment: WithId<CommentDBType>): Promise<CommentViewModel> {
        return {
            id: dbComment._id.toString(),
            content: dbComment.content,
            commentatorInfo: dbComment.commentatorInfo,
            createdAt: dbComment.createdAt,
        };
    },
    async mapBusinessEntityToOutput(comment: CommentType): Promise<CommentViewModel> {
        return {
            id: comment.id,
            content: comment.content,
            commentatorInfo: comment.commentatorInfo,
            createdAt: comment.createdAt,
        };
    },
    async countPostComments(postId: string): Promise<number> {
        const filterObj = { isDeleted: false, postId };
        return commentsCollection.countDocuments(filterObj);
    },
};