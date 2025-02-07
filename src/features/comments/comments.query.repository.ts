import {CommentDBType, CommentType, CommentViewModel} from "./comments.types";
import {CommentModel} from "../../db/db";
import {ObjectId, WithId} from "mongodb";
import {Paginator} from "../../types/types";

export const commentsQueryRepository = {
    async findCommentById(id: string): Promise<CommentViewModel | null> {
        const filterObj: any = { isDeleted: false, _id: new ObjectId(id) };
        const comment = await CommentModel.findOne(filterObj).lean();
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
    async createCommentsPaginator(items: WithId<CommentDBType>[], page: number, pageSize: number,
                                   pagesCount: number, totalCount: number): Promise<Paginator<CommentViewModel>> {
        const itemsViewModels: CommentViewModel[] = await Promise.all(
            items.map(this.mapToOutput)
        );

        return {
            pagesCount,
            page,
            pageSize,
            totalCount,
            items: itemsViewModels,
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
        return CommentModel.countDocuments(filterObj);
    },
};