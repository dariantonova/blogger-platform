import {PostDBType} from "../../types";
import {postsRepository} from "./repositories/posts.repository";
import {blogsQueryRepository} from "../blogs/repositories/blogs.query-repository";

export const postsService = {
    async deletePost(id: string): Promise<boolean> {
        return postsRepository.deletePost(id);
    },
    async createPost(title: string, shortDescription: string, content: string, blogId: string): Promise<PostDBType | null> {
        const blog = await blogsQueryRepository.findBlogById(blogId);
        if (!blog) {
            return null;
        }

        const createdPost: PostDBType = {
            id: String(+new Date()),
            title,
            shortDescription,
            content,
            blogId,
            blogName: blog.name,
            isDeleted: false,
            createdAt: new Date().toISOString(),
        };

        return postsRepository.createPost(createdPost);
    },
    async updatePost(id: string, title: string, shortDescription: string,
                     content: string, blogId: string): Promise<boolean> {
        const blog = await blogsQueryRepository.findBlogById(blogId);
        if (!blog) {
            // if the post's blog doesn't exist, the post shouldn't exist either
            // it's the same as if the post was not found
            return false;
        }

        return postsRepository.updatePost(id, title, shortDescription, content, blogId, blog.name);
    },
    async deleteAllPosts() {
        return postsRepository.deleteAllPosts();
    },
};