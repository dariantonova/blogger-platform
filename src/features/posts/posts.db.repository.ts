import {initialDb as db, postsCollection} from "../../db/db";
import {PostDBType} from "../../types";

export const postsRepository = {
    async findPosts(): Promise<PostDBType[]> {
        return postsCollection.find({ isDeleted: false }).toArray();
    },
    async findPostById(id: string): Promise<PostDBType | null> {
        return postsCollection.findOne({ isDeleted: false, id: id });
    },
    async deletePost(id: string): Promise<boolean> {
        const updatePostInfo = await postsCollection.updateOne(
            { isDeleted: false, id: id },
            { $set: { isDeleted: true } }
        );

        return updatePostInfo.modifiedCount === 1;
    },
    async createPost(title: string, shortDescription: string, content: string, blogId: string): Promise<PostDBType> {
        const createdPost: PostDBType = {
            id: String(+new Date()),
            title,
            shortDescription,
            content,
            blogId,
            isDeleted: false,
            createdAt: new Date().toISOString(),
        };

        await postsCollection.insertOne(createdPost);

        return createdPost;
    },
    async updatePost(id: string, title: string, shortDescription: string,
                     content: string, blogId: string): Promise<boolean> {
        const updatePostInfo = await postsCollection.updateOne(
            { isDeleted: false, id: id },
            { $set: { title, shortDescription, content, blogId } }
        );

        return updatePostInfo.matchedCount === 1;
    },
    async deleteAllPosts() {
        await postsCollection.drop();
    },
};