import {BlogDBType} from "../../../types/types";
import {BlogModel} from "../../../db/db";
import {injectable} from "inversify";

@injectable()
export class BlogsRepository {
    async deleteBlog(id: string): Promise<boolean> {
        const updateBlogInfo = await BlogModel.updateOne(
            { isDeleted: false, id },
            { isDeleted: true }
        );

        return updateBlogInfo.modifiedCount === 1;
    };
    async createBlog(createdBlog: BlogDBType) {
        await BlogModel.create(createdBlog);
    };
    async updateBlog(id: string, name: string, description: string, websiteUrl: string): Promise<boolean> {
        const updateBlogInfo = await BlogModel.updateOne(
            { isDeleted: false, id },
            { name, description, websiteUrl }
        );

        return updateBlogInfo.matchedCount === 1;
    };
    async deleteAllBlogs() {
        await BlogModel.deleteMany({});
    };
    async findBlogById(id: string): Promise<BlogDBType | null> {
        const filterObj: any = { isDeleted: false, id };
        return BlogModel.findOne(filterObj, { _id: 0 }).lean();
    };
}