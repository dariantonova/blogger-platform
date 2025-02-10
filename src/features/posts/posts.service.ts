import {PostDBType, SortDirections} from "../../types/types";
import {PostsRepository} from "./repositories/posts.repository";
import {BlogsRepository} from "../blogs/repositories/blogs.repository";
import {CommentsRepository} from "../comments/comments.repository";

export class PostsService {
    constructor(protected postsRepository: PostsRepository,
                protected blogsRepository: BlogsRepository,
                protected commentsRepository: CommentsRepository
    ) {}

    async deletePost(id: string): Promise<boolean> {
        const isDeleted = await this.postsRepository.deletePost(id);

        if (isDeleted) {
            await this.commentsRepository.deletePostComments(id);
        }

        return isDeleted;
    };
    async createPost(title: string, shortDescription: string, content: string, blogId: string): Promise<string | null> {
        const blog = await this.blogsRepository.findBlogById(blogId);
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

        await this.postsRepository.createPost(createdPost);

        return createdPost.id;
    };
    async updatePost(id: string, title: string, shortDescription: string,
                     content: string, blogId: string): Promise<boolean> {
        const blog = await this.blogsRepository.findBlogById(blogId);
        if (!blog) {
            throw new Error(`New blog of post doesn't exist`);
        }

        return this.postsRepository.updatePost(id, title, shortDescription, content, blogId, blog.name);
    };
    async deleteAllPosts() {
        return this.postsRepository.deleteAllPosts();
    };
    async findBlogPosts(blogId: string, sortBy: string, sortDirection: SortDirections,
                        pageNumber: number, pageSize: number): Promise<PostDBType[] | null> {
        const blog = await this.blogsRepository.findBlogById(blogId);
        if (!blog) {
            return null;
        }

        return this.postsRepository.findBlogPosts(
            blogId, sortBy, sortDirection, pageNumber, pageSize
        );
    };
    async findPostById(id: string): Promise<PostDBType | null> {
        return this.postsRepository.findPostById(id);
    };
}