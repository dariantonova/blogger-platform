import {LikeStatus, PostDBType, SortDirections} from "../../types/types";
import {PostsRepository} from "./repositories/posts.repository";
import {BlogsRepository} from "../blogs/repositories/blogs.repository";
import {CommentsRepository} from "../comments/comments.repository";
import {inject, injectable} from "inversify";
import {Result} from "../../common/result/result.type";
import {ResultStatus} from "../../common/result/resultStatus";
import {LikesService} from "../likes/likes.service";
import {LikesRepository} from "../likes/likes.repository";
import {ExtendedLikesInfo} from "../likes/likes.types";

@injectable()
export class PostsService {
    constructor(
        @inject(PostsRepository) protected postsRepository: PostsRepository,
        @inject(BlogsRepository) protected blogsRepository: BlogsRepository,
        @inject(CommentsRepository) protected commentsRepository: CommentsRepository,
        @inject(LikesService) protected likesService: LikesService,
        @inject(LikesRepository) protected likesRepository: LikesRepository,
    ) {}

    async deletePost(id: string): Promise<boolean> {
        const isDeleted = await this.postsRepository.deletePost(id);

        if (isDeleted) {
            await this.commentsRepository.deletePostComments(id);

            const arePostLikesDeleted = this.likesRepository.deleteLikesOfParent(id);
            if (!arePostLikesDeleted) {
                return false;
            }
        }

        return isDeleted;
    };
    async createPost(title: string, shortDescription: string, content: string, blogId: string): Promise<string | null> {
        const blog = await this.blogsRepository.findBlogById(blogId);
        if (!blog) {
            return null;
        }

        const extendedLikesInfo: ExtendedLikesInfo = {
            likesCount: 0,
            dislikesCount: 0,
            newestLikes: [],
        };
        const createdPost = new PostDBType(
            String(+new Date()),
            title,
            shortDescription,
            content,
            blogId,
            blog.name,
            false,
            new Date().toISOString(),
            extendedLikesInfo
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
    async makePostLikeOperation(postId: string, userId: string, likeStatus: LikeStatus): Promise<Result<null>> {
        const post = await this.postsRepository.findPostById(postId);
        if (!post) {
            return {
                status: ResultStatus.NOT_FOUND,
                data: null,
                extensions: [],
            };
        }

        return this.likesService.makeLikeOperation(userId, postId, likeStatus);
    };
}