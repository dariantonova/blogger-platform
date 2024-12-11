import {db} from "../../db/db";
import {PostDBType} from "../../types";

export const postsRepository = {
    findPosts(): PostDBType[] {
        return db.posts.filter(p => !p.isDeleted);
    },
    deleteAllPosts() {
        db.posts = [];
    },
};