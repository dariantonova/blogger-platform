import {db} from "../../db/db";
import {BlogDBType} from "../../types";
import {postsRepository} from "../posts/posts.repository";

export const blogsRepository = {
    findBlogs(): BlogDBType[] {
        return db.blogs.filter(b => !b.isDeleted);
    },
    findBlogById(id: string): BlogDBType | undefined {
        return blogsRepository.findBlogs()
            .find(b => b.id === id);
    },
    deleteBlog(id: string): boolean {
        const blogs = blogsRepository.findBlogs();
        for (let i = 0; i < blogs.length; i++) {
            if (blogs[i].id === id) {
                blogs[i].isDeleted = true;

                // delete all related posts
                postsRepository.findPosts().forEach(p => {
                    if (p.blogId === id) {
                        p.isDeleted = true;
                    }
                });

                return true;
            }
        }
        return false;
    },
    createBlog(name: string, description: string, websiteUrl: string): BlogDBType {
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
    updateBlog(id: string, name: string, description: string, websiteUrl: string): boolean {
        const blog = blogsRepository.findBlogs()
            .find(b => b.id === id);
        if (!blog) {
            return false;
        }

        blog.name = name;
        blog.description = description;
        blog.websiteUrl = websiteUrl;

        return true;
    },
    deleteAllBlogs() {
        db.blogs = [];
    },
};