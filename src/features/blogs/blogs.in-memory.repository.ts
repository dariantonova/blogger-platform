import {BlogDBType} from "../../types";
import {postsRepository} from "../posts/posts.in-memory.repository";
import {initialDb as db} from "../../db/db";

export const blogsRepository = {
    async findBlogs(): Promise<BlogDBType[]> {
        return db.blogs.filter(b => !b.isDeleted);
    },
    async findBlogById(id: string): Promise<BlogDBType | null> {
        const blogs = await blogsRepository.findBlogs();
        return blogs.find(b => b.id === id) || null;
    },
    async deleteBlog(id: string): Promise<boolean> {
        const blogs = await blogsRepository.findBlogs();
        for (let i = 0; i < blogs.length; i++) {
            if (blogs[i].id === id) {
                blogs[i].isDeleted = true;

                // delete all related posts
                const posts = await postsRepository.findPosts();
                posts.forEach(p => {
                    if (p.blogId === id) {
                        p.isDeleted = true;
                    }
                });

                return true;
            }
        }
        return false;
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

        db.blogs.push(createdBlog);

        return createdBlog;
    },
    async updateBlog(id: string, name: string, description: string, websiteUrl: string): Promise<boolean> {
        const blog = await blogsRepository.findBlogById(id);
        if (!blog) {
            return false;
        }

        blog.name = name;
        blog.description = description;
        blog.websiteUrl = websiteUrl;

        return true;
    },
    async deleteAllBlogs() {
        db.blogs = [];
    },
};