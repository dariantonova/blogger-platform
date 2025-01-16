import {CommentDBType, CommentType} from "./comments.types";
import {commentsCollection} from "../../db/db";
import {SortDirections} from "../../types/types";
import {WithId} from "mongodb";

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
    async findPostComments(postId: string, sortBy: string, sortDirection: SortDirections,
                           pageNumber: number, pageSize: number): Promise<CommentType[]> {
        const filterObj = { isDeleted: false, postId };

        const sortObj: any = {
            [sortBy]: sortDirection === SortDirections.ASC ? 1 : -1,
            _id: 1,
        };

        const foundComments = await commentsCollection
            .find(filterObj)
            .sort(sortObj)
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .toArray();

        return Promise.all(foundComments.map(this.mapToBusinessEntity));
    },
    async mapToBusinessEntity(dbComment: WithId<CommentDBType>): Promise<CommentType> {
        return {
            id: dbComment._id.toString(),
            content: dbComment.content,
            postId: dbComment.postId,
            commentatorInfo: dbComment.commentatorInfo,
            createdAt: dbComment.createdAt,
        };
    },
    async deleteAllComments() {
        await commentsCollection.drop();
    },
};