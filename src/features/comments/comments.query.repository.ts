import {CommentDBType, CommentType, CommentViewModel} from "./comments.types";
import {CommentModel} from "../../db/db";
import {ObjectId, WithId} from "mongodb";
import {Paginator} from "../../types/types";

export class CommentsQueryRepository {
    async findCommentById(id: string): Promise<CommentViewModel | null> {
        const filterObj: any = { isDeleted: false, _id: new ObjectId(id) };
        const comment = await CommentModel.findOne(filterObj).lean();
        return comment ? this.mapToOutput(comment) : null;
    };
    async mapToOutput(dbComment: WithId<CommentDBType>): Promise<CommentViewModel> {
        return new CommentViewModel(
            dbComment._id.toString(),
            dbComment.content,
            dbComment.commentatorInfo,
            dbComment.createdAt
        );
    };
    async createCommentsPaginator(items: WithId<CommentDBType>[], page: number, pageSize: number,
                                  pagesCount: number, totalCount: number): Promise<Paginator<CommentViewModel>> {
        const itemsViewModels: CommentViewModel[] = await Promise.all(
            items.map(this.mapToOutput)
        );

        return new Paginator<CommentViewModel>(
            itemsViewModels,
            pagesCount,
            page,
            pageSize,
            totalCount
        );
    };
    async mapBusinessEntityToOutput(comment: CommentType): Promise<CommentViewModel> {
        return new CommentViewModel(
            comment.id,
            comment.content,
            comment.commentatorInfo,
            comment.createdAt
        );
    };
    async countPostComments(postId: string): Promise<number> {
        const filterObj = { isDeleted: false, postId };
        return CommentModel.countDocuments(filterObj);
    };
}