import {initialDb as db} from "../../db/db";
import {PostDBType} from "../../types";

export const postsRepository = {
    async findPosts(): Promise<PostDBType[]> {
        return db.posts.filter(p => !p.isDeleted);
    },
    async findPostById(id: string): Promise<PostDBType | null> {
        const posts = await postsRepository.findPosts();
        return posts.find(p => p.id === id) || null;
    },
    async deletePost(id: string): Promise<boolean> {
        const posts = await postsRepository.findPosts();
        for (let i = 0; i < posts.length; i++) {
            if (posts[i].id === id) {
                posts[i].isDeleted = true;
                return true;
            }
        }
        return false;
    },
    async createPost(title: string, shortDescription: string, content: string, blogId: string): Promise<PostDBType> {
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
    async updatePost(id: string, title: string, shortDescription: string,
                     content: string, blogId: string): Promise<boolean> {
        const post = await postsRepository.findPostById(id);
        if (!post) {
            return false;
        }

        post.title = title;
        post.shortDescription = shortDescription;
        post.content = content;
        post.blogId = blogId;

        return true;
    },
    async deleteAllPosts() {
        db.posts = [];
    },
};