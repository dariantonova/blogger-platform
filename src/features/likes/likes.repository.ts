import {injectable} from "inversify";
import {LikeDBType, LikeStatus, LikeStatusEnum} from "../../types/types";
import {LikeModel} from "../../db/db";

@injectable()
export class LikesRepository {
    async findLikeByUserAndParent(userId: string, parentId: string): Promise<LikeDBType | null> {
        return LikeModel.findOne({ userId, parentId }, { _id: 0 }).lean();
    };
    async createLike(like: LikeDBType) {
        await LikeModel.create(like);
    };
    async updateLike(userId: string, parentId: string, status: LikeStatus): Promise<boolean> {
        const updateInfo = await LikeModel.updateOne(
            { userId, parentId },
            { status }
        );
        return updateInfo.matchedCount === 1;
    };
    async countLikesOfParent(parentId: string): Promise<number> {
        return LikeModel.countDocuments({ parentId, status: LikeStatusEnum.like });
    };
    async countDislikesOfParent(parentId: string): Promise<number> {
        return LikeModel.countDocuments({ parentId, status: LikeStatusEnum.dislike });
    };
    async deleteAllLikes() {
        await LikeModel.deleteMany({});
    };
    async findLikesOfUser(userId: string): Promise<LikeDBType[]> {
        return LikeModel.find({ userId }, { _id: 0 }).lean();
    };
    async deleteLikesOfUser(userId: string) {
        await LikeModel.deleteMany({ userId });
    };
    async deleteLikesOfParent(parentId: string) {
        await LikeModel.deleteMany({ parentId });
    };
    async findNewestLikesOfParent(parentId: string, quantity: number): Promise<LikeDBType[]> {
        const sortObj: any = {
            createdAt: -1,
            _id: 1,
        };

        return LikeModel
            .find({ parentId }, { _id: 0 })
            .sort(sortObj)
            .limit(quantity)
            .lean();
    };
}