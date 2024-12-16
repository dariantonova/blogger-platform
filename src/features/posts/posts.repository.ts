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
    createPost(title: string, shortDescription: string, content: string, blogId: string): PostDBType {
        const createdPost: PostDBType = {
            id: String(+new Date()),
            title,
            shortDescription,
            content,
            blogId,
            isDeleted: false,
            createdAt: new Date().toISOString(),
        };

        db.posts.push(createdPost);

        return createdPost;
    },
    updatePost(id: string, title: string, shortDescription: string, content: string, blogId: string): boolean {
        const post = postsRepository.findPostById(id);
        if (!post) {
            return false;
        }

        post.title = title;
        post.shortDescription = shortDescription;
        post.content = content;
        post.blogId = blogId;

        return true;
    },
    deleteAllPosts() {
        db.posts = [];
    },
};