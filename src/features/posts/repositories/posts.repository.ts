import {PostModel} from "../../../db/db";
import {PostDBType, SortDirections} from "../../../types/types";
import {injectable} from "inversify";
import {ExtendedLikesInfo} from "../../likes/likes.types";

@injectable()
export class PostsRepository {
    async deletePost(id: string): Promise<boolean> {
        const updatePostInfo = await PostModel.updateOne(
            { isDeleted: false, id },
            { isDeleted: true }
        );

        return updatePostInfo.modifiedCount === 1;
    };
    async createPost(createdPost: PostDBType) {
        await PostModel.create(createdPost);
    };
    async updatePost(id: string, title: string, shortDescription: string,
                     content: string, blogId: string, blogName: string): Promise<boolean> {
        const updatePostInfo = await PostModel.updateOne(
            { isDeleted: false, id },
            { title, shortDescription, content, blogId, blogName }
        );

        return updatePostInfo.matchedCount === 1;
    };
    async deleteAllPosts() {
        await PostModel.deleteMany({});
    };
    async updatePostsBlogNames(blogId: string, blogName: string) {
        await PostModel.updateMany(
            { isDeleted: false, blogId },
            { blogName }
        );
    };
    async deleteBlogPosts(blogId: string) {
        await PostModel.updateMany(
            { isDeleted: false, blogId },
            { isDeleted: true }
        );
    };
    async findBlogPosts(blogId: string, sortBy: string, sortDirection: SortDirections,
                        pageNumber: number, pageSize: number): Promise<PostDBType[]> {
        const filterObj: any = { isDeleted: false, blogId };

        const sortObj: any = {
            [sortBy]: sortDirection === SortDirections.ASC ? 1 : -1,
            _id: 1,
        };

        return PostModel
            .find(filterObj, { _id: 0 })
            .sort(sortObj)
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .lean();
    };
    async findPostById(id: string): Promise<PostDBType | null> {
        const filterObj: any = { isDeleted: false, id };
        return PostModel.findOne(filterObj, { _id: 0 }).lean();
    };
    async updatePostExtendedLikesInfo(id: string, extendedLikesInfo: ExtendedLikesInfo): Promise<boolean> {
        const updateInfo = await PostModel.updateOne(
            { isDeleted: false, id },
            { extendedLikesInfo }
        );
        return updateInfo.matchedCount === 1;
    };
}