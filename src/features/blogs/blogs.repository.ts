import {db} from "../../db/db";
import {BlogType} from "../../types";

export const blogsRepository = {
    findBlogs(): BlogType[] {
        return db.blogs;
    },
    findBlogById(id: string): BlogType | undefined {
        return db.blogs.find(b => b.id === id);
    },
    deleteBlog(id: string): boolean {
        for (let i = 0; i < db.blogs.length; i++) {
            if (db.blogs[i].id === id) {
                db.blogs.splice(i, 1);
                return true;
            }
        }
        return false;
    },
    deleteAllBlogs() {
        db.blogs = [];
    },
};