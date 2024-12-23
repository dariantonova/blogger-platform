import {BlogDBType} from "../../types";
import {blogsRepository} from "./blogs.db.repository";

export const blogsService = {
    async findBlogs(searchNameTerm: string | null): Promise<BlogDBType[]> {
        return blogsRepository.findBlogs(searchNameTerm);
    },
    async findBlogById(id: string): Promise<BlogDBType | null> {
        return blogsRepository.findBlogById(id);
    },
    async deleteBlog(id: string): Promise<boolean> {
        return blogsRepository.deleteBlog(id);
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

        await blogsRepository.createBlog(createdBlog);

        return createdBlog;
    },
    async updateBlog(id: string, name: string, description: string, websiteUrl: string): Promise<boolean> {
        return blogsRepository.updateBlog(id, name, description, websiteUrl);
    },
    async deleteAllBlogs() {
        return blogsRepository.deleteAllBlogs();
    },
};