import {postsCollection} from "../../../db/db";
import {PostDBType, SortDirections} from "../../../types/types";

export const postsRepository = {
    async deletePost(id: string): Promise<boolean> {
        const updatePostInfo = await postsCollection.updateOne(
            { isDeleted: false, id: id },
            { $set: { isDeleted: true } }
        );

        return updatePostInfo.modifiedCount === 1;
    },
    async createPost(createdPost: PostDBType) {
        await postsCollection.insertOne(createdPost);
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
    async findBlogPosts(blogId: string, sortBy: string, sortDirection: SortDirections,
                        pageNumber: number, pageSize: number): Promise<PostDBType[]> {
        const filterObj: any = { isDeleted: false, blogId: blogId };

        const sortObj: any = {
            [sortBy]: sortDirection === SortDirections.ASC ? 1 : -1,
            _id: 1,
        };

        return await postsCollection
            .find(filterObj, { projection: { _id: 0 } })
            .sort(sortObj)
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .toArray() as PostDBType[];
    },
    async findPostById(id: string): Promise<PostDBType | null> {
        const filterObj: any = { idDeleted: false, id };
        return postsCollection.findOne(filterObj, { projection: { _id: 0 } });
    },
};