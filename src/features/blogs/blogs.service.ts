import {BlogDBType} from "../../types/types";
import {BlogsRepository} from "./repositories/blogs.repository";
import {PostsRepository} from "../posts/repositories/posts.repository";

export class BlogsService {
    private blogsRepository: BlogsRepository;
    private postsRepository: PostsRepository;
    constructor() {
        this.blogsRepository = new BlogsRepository();
        this.postsRepository = new PostsRepository();
    }

    async deleteBlog(id: string): Promise<boolean> {
        const isBlogDeleted = await this.blogsRepository.deleteBlog(id);

        if (isBlogDeleted) {
            await this.postsRepository.deleteBlogPosts(id);
        }

        return isBlogDeleted;
    };
    async createBlog(name: string, description: string, websiteUrl: string): Promise<string> {
        const createdBlog = new BlogDBType(
            String(+new Date()),
            name,
            description,
            websiteUrl,
            false,
            new Date().toISOString(),
            false
        );

        await this.blogsRepository.createBlog(createdBlog);

        return createdBlog.id;
    };
    async updateBlog(id: string, name: string, description: string, websiteUrl: string): Promise<boolean> {
        const isBlogUpdated = await this.blogsRepository.updateBlog(id, name, description, websiteUrl);

        if (isBlogUpdated) {
            await this.postsRepository.updatePostsBlogNames(id, name);
        }

        return isBlogUpdated;
    };
    async deleteAllBlogs() {
        return this.blogsRepository.deleteAllBlogs();
    };
}

export const blogsService = new BlogsService();