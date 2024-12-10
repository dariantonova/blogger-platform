import {db} from "../../db/db";
import {BlogDBType} from "../../types";

export const blogsRepository = {
    findBlogs(): BlogDBType[] {
        return db.blogs.filter(b => !b.isDeleted);
    },
    findBlogById(id: string): BlogDBType | undefined {
        return db.blogs.filter(b => !b.isDeleted)
            .find(b => b.id === id);
    },
    deleteBlog(id: string): boolean {
        for (let i = 0; i < db.blogs.length; i++) {
            if (db.blogs[i].id === id) {
                db.blogs[i].isDeleted = true;
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
        };

        db.blogs.push(createdBlog);

        return createdBlog;
    },
    deleteAllBlogs() {
        db.blogs = [];
    },
};