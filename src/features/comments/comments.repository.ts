import {CommentDBType, CommentType} from "./comments.types";
import {commentsCollection} from "../../db/db";

export const commentsRepository = {
    async createComment(comment: Omit<CommentType, 'id'>): Promise<string> {
        const dbComment: CommentDBType = {
            content: comment.content,
            postId: comment.postId,
            commentatorInfo: comment.commentatorInfo,
            createdAt: comment.createdAt,
            isDeleted: false,
        };
        const insertInfo = await commentsCollection.insertOne(dbComment);
        return insertInfo.insertedId.toString();
    },
};