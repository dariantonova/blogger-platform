import {PostDBType} from "../../types";
import {postsRepository} from "./posts.db.repository";

export const postsService = {
    async findPosts(sortBy: string, sortDirection: string): Promise<PostDBType[]> {
        return postsRepository.findPosts(sortBy, sortDirection);
    },
    async findPostById(id: string): Promise<PostDBType | null> {
        return postsRepository.findPostById(id);
    },
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