import {BlogDBType} from "../../../types";
import {blogsCollection, postsCollection} from "../../../db/db";

export const blogsRepository = {
    async deleteBlog(id: string): Promise<boolean> {
        const updateBlogInfo = await blogsCollection.updateOne(
            { isDeleted: false, id: id },
            { $set: { isDeleted: true } }
        );

        await postsCollection.updateMany(
            { isDeleted: false, blogId: id },
            { $set: { isDeleted: true } }
        );

        return updateBlogInfo.modifiedCount === 1;
    },
    async createBlog(createdBlog: BlogDBType): Promise<BlogDBType> {
        await blogsCollection.insertOne(createdBlog);

        return createdBlog;
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
};