import {db} from "../../db/db";
import {PostDBType} from "../../types";

export const postsRepository = {
    findPosts(): PostDBType[] {
        return db.posts.filter(p => !p.isDeleted);
    },
    findPostById(id: string): PostDBType | undefined {
        return db.posts.filter(p => !p.isDeleted)
            .find(p => p.id === id);
    },
    deleteAllPosts() {
        db.posts = [];
    },
};