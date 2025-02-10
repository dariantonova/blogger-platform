import {PostDBType, SortDirections} from "../../types/types";
import {postsRepository} from "./repositories/posts.repository";
import {blogsRepository} from "../blogs/repositories/blogs.repository";
import {commentsRepository} from "../comments/comments.repository";

class PostsService {
    async deletePost(id: string): Promise<boolean> {
        const isDeleted = await postsRepository.deletePost(id);

        if (isDeleted) {
            await commentsRepository.deletePostComments(id);
        }

        return isDeleted;
    };
    async createPost(title: string, shortDescription: string, content: string, blogId: string): Promise<string | null> {
        const blog = await blogsRepository.findBlogById(blogId);
        if (!blog) {
            return null;
        }

        const createdPost = new PostDBType(
            String(+new Date()),
            title,
            shortDescription,
            content,
            blogId,
            blog.name,
            false,
            new Date().toISOString()
        );

        await postsRepository.createPost(createdPost);

        return createdPost.id;
    };
    async updatePost(id: string, title: string, shortDescription: string,
                     content: string, blogId: string): Promise<boolean> {
        const blog = await blogsRepository.findBlogById(blogId);
        if (!blog) {
            throw new Error(`New blog of post doesn't exist`);
        }

        return postsRepository.updatePost(id, title, shortDescription, content, blogId, blog.name);
    };
    async deleteAllPosts() {
        return postsRepository.deleteAllPosts();
    };
    async findBlogPosts(blogId: string, sortBy: string, sortDirection: SortDirections,
                        pageNumber: number, pageSize: number): Promise<PostDBType[] | null> {
        const blog = await blogsRepository.findBlogById(blogId);
        if (!blog) {
            return null;
        }

        return postsRepository.findBlogPosts(
            blogId, sortBy, sortDirection, pageNumber, pageSize
        );
    };
    async findPostById(id: string): Promise<PostDBType | null> {
        return postsRepository.findPostById(id);
    };
}

export const postsService = new PostsService();