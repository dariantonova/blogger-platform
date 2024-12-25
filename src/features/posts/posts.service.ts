import {PostDBType} from "../../types";
import {postsRepository} from "./repositories/posts.repository";

export const postsService = {
    async deletePost(id: string): Promise<boolean> {
        return postsRepository.deletePost(id);
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

        return postsRepository.createPost(createdPost);
    },
    async updatePost(id: string, title: string, shortDescription: string,
                     content: string, blogId: string): Promise<boolean> {
        return postsRepository.updatePost(id, title, shortDescription, content, blogId);
    },
    async deleteAllPosts() {
        return postsRepository.deleteAllPosts();
    },
};