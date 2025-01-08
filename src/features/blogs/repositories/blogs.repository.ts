import {BlogDBType} from "../../../types";
import {blogsCollection} from "../../../db/db";

export const blogsRepository = {
    async deleteBlog(id: string): Promise<boolean> {
        const updateBlogInfo = await blogsCollection.updateOne(
            { isDeleted: false, id: id },
            { $set: { isDeleted: true } }
        );

        return updateBlogInfo.modifiedCount === 1;
    },
    async createBlog(createdBlog: BlogDBType) {
        await blogsCollection.insertOne(createdBlog);
    },
    async updateBlog(id: string, name: string, description: string, websiteUrl: string): Promise<boolean> {
        const updateBlogInfo = await blogsCollection.updateOne(
            { isDeleted: false, id: id },
            { $set: { name, description, websiteUrl } }
        );

        return updateBlogInfo.matchedCount === 1;
    },
    async deleteAllBlogs() {
        await blogsCollection.drop();
    },
    async findBlogById(id: string): Promise<BlogDBType | null> {
        const filterObj: any = { isDeleted: false, id: id };
        return blogsCollection
            .findOne(filterObj, { projection: { _id: 0 } });
    },
};