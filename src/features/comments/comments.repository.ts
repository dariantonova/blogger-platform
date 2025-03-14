import {CommentatorInfo, CommentDBType, CommentType} from "./comments.types";
import {CommentModel} from "../../db/db";
import {SortDirections} from "../../types/types";
import {ObjectId, WithId} from "mongodb";
import {injectable} from "inversify";
import {LikesInfo} from "../likes/likes.types";

@injectable()
export class CommentsRepository {
    async createComment(content: string, postId: string,
                        commentatorInfo: CommentatorInfo, likesInfo: LikesInfo,
                        createdAt: string): Promise<string> {
        const dbComment = new CommentDBType(
            content,
            postId,
            commentatorInfo,
            likesInfo,
            createdAt,
            false
        );
        const insertInfo = await CommentModel.create(dbComment);
        return insertInfo._id.toString();
    };
    async findPostComments(postId: string, sortBy: string, sortDirection: SortDirections,
                           pageNumber: number, pageSize: number): Promise<CommentType[]> {
        const filterObj = { isDeleted: false, postId };

        if (sortBy.startsWith('user')) {
            sortBy = 'commentatorInfo.' + sortBy;
        }

        const sortObj: any = {
            [sortBy]: sortDirection === SortDirections.ASC ? 1 : -1,
            _id: 1,
        };

        if (sortBy === 'id') {
            sortObj._id = sortDirection === SortDirections.ASC ? 1 : -1;
        }

        const foundComments = await CommentModel
            .find(filterObj)
            .sort(sortObj)
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .lean();

        return Promise.all(foundComments.map(this.mapToBusinessEntity));
    };
    async mapToBusinessEntity(dbComment: WithId<CommentDBType>): Promise<CommentType> {
        return new CommentType(
            dbComment._id.toString(),
            dbComment.content,
            dbComment.postId,
            dbComment.commentatorInfo,
            dbComment.likesInfo,
            dbComment.createdAt
        );
    };
    async deleteAllComments() {
        await CommentModel.deleteMany({});
    };
    async findCommentById(id: string): Promise<CommentType | null> {
        try {
            const filterObj = { isDeleted: false, _id: new ObjectId(id) };
            const foundComment = await CommentModel.findOne(filterObj).lean();
            return foundComment ? this.mapToBusinessEntity(foundComment) : null;
        }
        catch (err) {
            return null;
        }
    };
    async deleteComment(id: string): Promise<boolean> {
        const updateInfo = await CommentModel.updateOne(
            { isDeleted: false, _id: new ObjectId(id) },
            { isDeleted: true }
        );

        return updateInfo.modifiedCount === 1;
    };
    async updateComment(id: string, content: string): Promise<boolean> {
        const updateInfo = await CommentModel.updateOne(
            { isDeleted: false, _id: new ObjectId(id) },
            { content }
        );

        return updateInfo.matchedCount === 1;
    };
    async deletePostComments(postId: string) {
        await CommentModel.updateMany(
            { isDeleted: false, postId },
            { isDeleted: true }
        );
    };
    async updateCommentLikesCount(id: string, likesCount: number): Promise<boolean> {
        const updateInfo = await CommentModel
            .updateOne({ isDeleted: false, _id: new ObjectId(id) }, { 'likesInfo.likesCount': likesCount });

        return updateInfo.matchedCount === 1;
    };
    async updateCommentDislikesCount(id: string, dislikesCount: number): Promise<boolean> {
        const updateInfo = await CommentModel
            .updateOne({ isDeleted: false, _id: new ObjectId(id) }, { 'likesInfo.dislikesCount': dislikesCount });

        return updateInfo.matchedCount === 1;
    };
    async updateCommentLikesInfo(id: string, likesInfo: LikesInfo): Promise<boolean> {
        const updateInfo = await CommentModel.updateOne(
            { isDeleted: false, _id: new ObjectId(id) },
            { likesInfo }
        );
        return updateInfo.matchedCount === 1;
    };
}