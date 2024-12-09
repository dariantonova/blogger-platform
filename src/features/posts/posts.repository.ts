import {db} from "../../db/db";

export const postsRepository = {
    deleteAllPosts() {
        db.posts = [];
    },
};