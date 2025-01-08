import {BlogDBType} from "../../types";
import {blogsRepository} from "./repositories/blogs.repository";
import {postsRepository} from "../posts/repositories/posts.repository";

export const blogsService = {
    async deleteBlog(id: string): Promise<boolean> {
        const isBlogDeleted = await blogsRepository.deleteBlog(id);

        if (isBlogDeleted) {
            await postsRepository.deleteBlogPosts(id);
        }

        return isBlogDeleted;
    },
    async createBlog(name: string, description: string, websiteUrl: string): Promise<string> {
        const createdBlog: BlogDBType = {
            id: String(+new Date()),
            name,
            description,
            websiteUrl,
            isDeleted: false,
            createdAt: new Date().toISOString(),
            isMembership: false,
        };

        await blogsRepository.createBlog(createdBlog);

        return createdBlog.id;
    },
    async updateBlog(id: string, name: string, description: string, websiteUrl: string): Promise<boolean> {
        const isBlogUpdated = await blogsRepository.updateBlog(id, name, description, websiteUrl);

        if (isBlogUpdated) {
            await postsRepository.updatePostsBlogNames(id, name);
        }

        return isBlogUpdated;
    },
    async deleteAllBlogs() {
        return blogsRepository.deleteAllBlogs();
    },
};