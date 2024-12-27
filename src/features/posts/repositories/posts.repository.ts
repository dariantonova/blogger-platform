import {postsCollection} from "../../../db/db";
import {PostDBType} from "../../../types";

export const postsRepository = {
    async deletePost(id: string): Promise<boolean> {
        const updatePostInfo = await postsCollection.updateOne(
            { isDeleted: false, id: id },
            { $set: { isDeleted: true } }
        );

        return updatePostInfo.modifiedCount === 1;
    },
    async createPost(createdPost: PostDBType): Promise<PostDBType> {
        await postsCollection.insertOne(createdPost);

        return createdPost;
    },
    async updatePost(id: string, title: string, shortDescription: string,
                     content: string, blogId: string, blogName: string): Promise<boolean> {
        const updatePostInfo = await postsCollection.updateOne(
            { isDeleted: false, id: id },
            { $set: { title, shortDescription, content, blogId, blogName } }
        );

        return updatePostInfo.matchedCount === 1;
    },
    async deleteAllPosts() {
        await postsCollection.drop();
    },
    async updatePostsBlogNames(blogId: string, blogName: string) {
        await postsCollection.updateMany(
            { isDeleted: false, blogId: blogId },
            { $set: { blogName } }
        );
    },
    async deleteBlogPosts(blogId: string) {
        await postsCollection.updateMany(
            { isDeleted: false, blogId: blogId },
            { $set: { isDeleted: true } }
        );
    },
};