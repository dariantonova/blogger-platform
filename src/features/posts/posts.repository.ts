import {db} from "../../db/db";
import {PostDBType} from "../../types";

export const postsRepository = {
    findPosts(): PostDBType[] {
        return db.posts.filter(p => !p.isDeleted);
    },
    findPostById(id: string): PostDBType | undefined {
        return postsRepository.findPosts()
            .find(p => p.id === id);
    },
    deletePost(id: string): boolean {
        const posts = postsRepository.findPosts();
        for (let i = 0; i < posts.length; i++) {
            if (posts[i].id === id) {
                posts[i].isDeleted = true;
                return true;
            }
        }
        return false;
    },
    deleteAllPosts() {
        db.posts = [];
    },
};