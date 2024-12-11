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
    deletePost(id: string): boolean {
        for (let i = 0; i < db.posts.length; i++) {
            if (db.posts[i].id === id) {
                db.posts[i].isDeleted = true;
                return true;
            }
        }
        return false;
    },
    deleteAllPosts() {
        db.posts = [];
    },
};