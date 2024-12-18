import {BlogDBType} from "../../types";
import {blogsCollection, postsCollection} from "../../db/db";

export const blogsRepository = {
    async findBlogs(): Promise<BlogDBType[]> {
        return await blogsCollection.find({ isDeleted: false }, { projection: { _id: 0 } })
            .toArray() as BlogDBType[];
    },
    async findBlogById(id: string): Promise<BlogDBType | null> {
        return blogsCollection.findOne({ isDeleted: false, id: id }, { projection: { _id: 0 } });
    },
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
    async createBlog(name: string, description: string, websiteUrl: string): Promise<BlogDBType> {
        const createdBlog: BlogDBType = {
            id: String(+new Date()),
            name,
            description,
            websiteUrl,
            isDeleted: false,
            createdAt: new Date().toISOString(),
            isMembership: false,
        };

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