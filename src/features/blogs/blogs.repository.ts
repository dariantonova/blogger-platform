import {db} from "../../db/db";
import {BlogType} from "../../types";

export const blogsRepository = {
    findBlogs(): BlogType[] {
        return db.blogs;
    },
    findBlogById(id: string): BlogType | undefined {
        return db.blogs.find(b => b.id === id);
    },
    deleteAllBlogs() {
        db.blogs = [];
    },
};