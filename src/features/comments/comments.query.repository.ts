import {CommentDBType, CommentViewModel} from "./comments.types";
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
};