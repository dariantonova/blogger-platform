import {CommentDBType, CommentType, CommentViewModel, LikesInfoViewModel} from "./comments.types";
import {CommentModel} from "../../db/db";
import {ObjectId, WithId} from "mongodb";
import {LikeStatus, LikeStatusEnum, Paginator} from "../../types/types";
import {inject, injectable} from "inversify";
import {CommentLikesRepository} from "./comment-likes/comment-likes.repository";

@injectable()
export class CommentsQueryRepository {
    constructor(
        @inject(CommentLikesRepository) protected commentLikesRepository: CommentLikesRepository
    ) {}

    async findCommentById(id: string, userId: string | null): Promise<CommentViewModel | null> {
        const filterObj: any = { isDeleted: false, _id: new ObjectId(id) };
        const comment = await CommentModel.findOne(filterObj).lean();
        return comment ? this.mapToOutput(comment, userId) : null;
    };
    async mapToOutput(dbComment: WithId<CommentDBType>, userId: string | null): Promise<CommentViewModel> {
        const commentId = dbComment._id.toString();
        const myStatus = userId === null ? LikeStatusEnum.none
            : await this._getUserCommentLikeStatus(userId, commentId);

        const likesInfo = new LikesInfoViewModel(
            dbComment.likesInfo.likesCount,
            dbComment.likesInfo.dislikesCount,
            myStatus
        );

        return new CommentViewModel(
            commentId,
            dbComment.content,
            dbComment.commentatorInfo,
            likesInfo,
            dbComment.createdAt
        );
    };
    async _getUserCommentLikeStatus(userId: string, commentId: string): Promise<LikeStatus> {
        const commentLike = await this.commentLikesRepository
            .findCommentLikeByUserIdAndCommentId(userId, commentId);
        return commentLike ? commentLike.likeStatus : LikeStatusEnum.none;
    };
    async createCommentsPaginator(items: WithId<CommentDBType>[], page: number, pageSize: number,
                                  pagesCount: number, totalCount: number, userId: string | null): Promise<Paginator<CommentViewModel>> {
        const itemsViewModels: CommentViewModel[] = await Promise.all(
            items.map(item => this.mapToOutput(item, userId))
        );

        return new Paginator<CommentViewModel>(
            itemsViewModels,
            pagesCount,
            page,
            pageSize,
            totalCount
        );
    };
    async mapBusinessEntityToOutput(comment: CommentType, userId: string | null): Promise<CommentViewModel> {
        const myStatus = userId === null ? LikeStatusEnum.none
            : await this._getUserCommentLikeStatus(userId, comment.id);

        const likesInfo = new LikesInfoViewModel(
            comment.likesInfo.likesCount,
            comment.likesInfo.dislikesCount,
            myStatus
        );

        return new CommentViewModel(
            comment.id,
            comment.content,
            comment.commentatorInfo,
            likesInfo,
            comment.createdAt
        );
    };
    async countPostComments(postId: string): Promise<number> {
        const filterObj = { isDeleted: false, postId };
        return CommentModel.countDocuments(filterObj);
    };
}