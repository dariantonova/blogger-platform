import {PostDBType, SortDirections} from "../../types";
import {postsRepository} from "./repositories/posts.repository";
import {blogsRepository} from "../blogs/repositories/blogs.repository";

export const postsService = {
    async deletePost(id: string): Promise<boolean> {
        return postsRepository.deletePost(id);
    },
    async createPost(title: string, shortDescription: string, content: string, blogId: string): Promise<string | null> {
        const blog = await blogsRepository.findBlogById(blogId);
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

        await postsRepository.createPost(createdPost);

        return createdPost.id;
    },
    async updatePost(id: string, title: string, shortDescription: string,
                     content: string, blogId: string): Promise<boolean> {
        const blog = await blogsRepository.findBlogById(blogId);
        if (!blog) {
            throw new Error(`New blog of post doesn't exist`);
        }

        return postsRepository.updatePost(id, title, shortDescription, content, blogId, blog.name);
    },
    async deleteAllPosts() {
        return postsRepository.deleteAllPosts();
    },
    async findBlogPosts(blogId: string, sortBy: string, sortDirection: SortDirections,
                        pageNumber: number, pageSize: number): Promise<PostDBType[] | null> {
        const blog = await blogsRepository.findBlogById(blogId);
        if (!blog) {
            return null;
        }

        return postsRepository.findPostsByBlogId(
            blogId, sortBy, sortDirection, pageNumber, pageSize
        );
    },
};