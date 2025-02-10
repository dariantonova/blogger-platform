import {
    BlogDBType,
    Paginator,
    RequestWithBody,
    RequestWithParams,
    RequestWithParamsAndBody,
    RequestWithParamsAndQuery,
    RequestWithQuery
} from "../../types/types";
import {BlogViewModel} from "./models/BlogViewModel";
import {Response} from "express";
import {URIParamsBlogIdModel} from "./models/URIParamsBlogIdModel";
import {HTTP_STATUSES} from "../../utils";
import {CreateBlogInputModel} from "./models/CreateBlogInputModel";
import {UpdateBlogInputModel} from "./models/UpdateBlogInputModel";
import {BlogsService} from "./blogs.service";
import {QueryBlogsModel} from "./models/QueryBlogsModel";
import {BlogsQueryRepository} from "./repositories/blogs.query.repository";
import {getBlogsQueryParamsValues, getPostsQueryParamsValues} from "../../helpers/query-params-values";
import {QueryPostsModel} from "../posts/models/QueryPostsModel";
import {PostViewModel} from "../posts/models/PostViewModel";
import {URIParamsPostBlogIdModel} from "./models/URIParamsPostBlogIdModel";
import {PostsQueryRepository} from "../posts/repositories/posts.query.repository";
import {PostsService} from "../posts/posts.service";
import {CreateBlogPostInputModel} from "./models/CreateBlogPostInputModel";
import {blogsQueryRepository} from "../../composition-root";

export const createBlogsPaginator = (items: BlogDBType[], page: number, pageSize: number,
                                     pagesCount: number, totalCount: number): Paginator<BlogViewModel> => {
    const itemsViewModels: BlogViewModel[] = items.map(blogsQueryRepository.mapToOutput);

    return new Paginator<BlogViewModel>(
        itemsViewModels,
        pagesCount,
        page,
        pageSize,
        totalCount
    );
};

export class BlogsController {
    constructor(protected blogsService: BlogsService,
                protected blogsQueryRepository: BlogsQueryRepository,
                protected postsService: PostsService,
                protected postsQueryRepository: PostsQueryRepository,
    ) {}

    async getBlogs (req: RequestWithQuery<QueryBlogsModel>,
                    res: Response<Paginator<BlogViewModel>>) {
        const {
            searchNameTerm,
            sortBy,
            sortDirection,
            pageSize,
            pageNumber
        } = getBlogsQueryParamsValues(req);

        const output = await this.blogsQueryRepository.findBlogs(
            searchNameTerm, sortBy, sortDirection, pageNumber, pageSize
        );

        res.json(output);
    };
    async getBlog (req: RequestWithParams<URIParamsBlogIdModel>,
                   res: Response<BlogViewModel>) {
        const foundBlog = await this.blogsQueryRepository.findBlogById(req.params.id);
        if (!foundBlog) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.json(foundBlog);
    };
    async deleteBlog (req: RequestWithParams<URIParamsBlogIdModel>, res: Response) {
        const isDeleted = await this.blogsService.deleteBlog(req.params.id);
        if (!isDeleted) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    };
    async createBlog (req: RequestWithBody<CreateBlogInputModel>,
                      res: Response<BlogViewModel>) {
        const createdBlogId = await this.blogsService.createBlog(
            req.body.name, req.body.description, req.body.websiteUrl
        );

        const createdBlog = await this.blogsQueryRepository.findBlogById(createdBlogId);
        if (!createdBlog) {
            res.sendStatus(HTTP_STATUSES.INTERNAL_SERVER_ERROR_500);
            return;
        }

        res
            .status(HTTP_STATUSES.CREATED_201)
            .json(createdBlog);
    };
    async updateBlog (req: RequestWithParamsAndBody<URIParamsBlogIdModel, UpdateBlogInputModel>,
                      res: Response) {
        const isUpdated = await this.blogsService.updateBlog(
            req.params.id, req.body.name, req.body.description, req.body.websiteUrl
        );
        if (!isUpdated) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    };
    async getBlogPosts (req: RequestWithParamsAndQuery<URIParamsPostBlogIdModel, QueryPostsModel>,
                        res: Response<Paginator<PostViewModel>>) {
        const blogId = req.params.blogId;
        const {
            sortBy,
            sortDirection,
            pageSize,
            pageNumber
        } = getPostsQueryParamsValues(req);

        const foundPosts = await this.postsService.findBlogPosts(
            blogId, sortBy, sortDirection, pageNumber, pageSize
        );
        if (!foundPosts) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        const totalCount = await this.postsQueryRepository.countBlogPosts(blogId);
        const pagesCount = Math.ceil(totalCount / pageSize);

        const output = await this.postsQueryRepository.createPostsPaginator(
            foundPosts, pageNumber, pageSize, pagesCount, totalCount
        );

        res.json(output);
    };
    async createBlogPost (req: RequestWithParamsAndBody<URIParamsPostBlogIdModel, CreateBlogPostInputModel>,
                          res: Response<PostViewModel>) {
        const createdPostId = await this.postsService.createPost(
            req.body.title, req.body.shortDescription, req.body.content, req.params.blogId
        );
        if (!createdPostId) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        const createdPost = await this.postsQueryRepository.findPostById(createdPostId);
        if (!createdPost) {
            res.sendStatus(HTTP_STATUSES.INTERNAL_SERVER_ERROR_500);
            return;
        }

        res
            .status(HTTP_STATUSES.CREATED_201)
            .json(createdPost);
    };
}