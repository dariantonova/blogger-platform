import {db} from "../../db/db";
import {BlogType} from "../../types";

export const blogsRepository = {
    findBlogs(): BlogType[] {
        return db.blogs;
    },
};