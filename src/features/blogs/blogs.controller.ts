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
import {blogsService} from "./blogs.service";
import {QueryBlogsModel} from "./models/QueryBlogsModel";
import {blogsQueryRepository} from "./repositories/blogs.query.repository";
import {getBlogsQueryParamsValues, getPostsQueryParamsValues} from "../../helpers/query-params-values";
import {validationResult} from "express-validator";
import {QueryPostsModel} from "../posts/models/QueryPostsModel";
import {PostViewModel} from "../posts/models/PostViewModel";
import {URIParamsPostBlogIdModel} from "./models/URIParamsPostBlogIdModel";
import {postsQueryRepository} from "../posts/repositories/posts.query.repository";
import {postsService} from "../posts/posts.service";
import {CreateBlogPostInputModel} from "./models/CreateBlogPostInputModel";

export const createBlogsPaginator = (items: BlogDBType[], page: number, pageSize: number,
                                     pagesCount: number, totalCount: number): Paginator<BlogViewModel> => {
    const itemsViewModels: BlogViewModel[] = items.map(blogsQueryRepository.mapToOutput);

    return {
        pagesCount,
        page,
        pageSize,
        totalCount,
        items: itemsViewModels,
    };
};

export const blogsController = {
    getBlogs: async (req: RequestWithQuery<QueryBlogsModel>,
                     res: Response<Paginator<BlogViewModel>>) => {
        const validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
            const output: Paginator<BlogViewModel> = {
                pagesCount: 0,
                page: 0,
                pageSize: 0,
                totalCount: 0,
                items: [],
            };

            res.json(output);
            return;
        }

        const {
            searchNameTerm,
            sortBy,
            sortDirection,
            pageSize,
            pageNumber
        } = getBlogsQueryParamsValues(req);

        const output = await blogsQueryRepository.findBlogs(
            searchNameTerm, sortBy, sortDirection, pageNumber, pageSize
        );

        res.json(output);
    },
    getBlog: async (req: RequestWithParams<URIParamsBlogIdModel>,
              res: Response<BlogViewModel>) => {
        const foundBlog = await blogsQueryRepository.findBlogById(req.params.id);
        if (!foundBlog) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.json(foundBlog);
    },
    deleteBlog: async (req: RequestWithParams<URIParamsBlogIdModel>, res: Response) => {
        const isDeleted = await blogsService.deleteBlog(req.params.id);
        if (!isDeleted) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    },
    createBlog: async (req: RequestWithBody<CreateBlogInputModel>,
                 res: Response<BlogViewModel>) => {
        const createdBlogId = await blogsService.createBlog(
            req.body.name, req.body.description, req.body.websiteUrl
        );

        const createdBlog = await blogsQueryRepository.findBlogById(createdBlogId);
        if (!createdBlog) {
            res.sendStatus(HTTP_STATUSES.INTERNAL_SERVER_ERROR_500);
            return;
        }

        res
            .status(HTTP_STATUSES.CREATED_201)
            .json(createdBlog);
    },
    updateBlog: async (req: RequestWithParamsAndBody<URIParamsBlogIdModel, UpdateBlogInputModel>,
                 res: Response) => {
        const isUpdated = await blogsService.updateBlog(
            req.params.id, req.body.name, req.body.description, req.body.websiteUrl
        );
        if (!isUpdated) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    },
    getBlogPosts: async (req: RequestWithParamsAndQuery<URIParamsPostBlogIdModel, QueryPostsModel>,
                         res: Response<Paginator<PostViewModel>>) => {
        const validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
            const output: Paginator<PostViewModel> = {
                pagesCount: 0,
                page: 0,
                pageSize: 0,
                totalCount: 0,
                items: [],
            };

            res.json(output);
            return;
        }

        const blogId = req.params.blogId;
        const {
            sortBy,
            sortDirection,
            pageSize,
            pageNumber
        } = getPostsQueryParamsValues(req);

        const foundPosts = await postsService.findBlogPosts(
            blogId, sortBy, sortDirection, pageNumber, pageSize
        );
        if (!foundPosts) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        const totalCount = await postsQueryRepository.countPostsOfBlog(blogId);
        const pagesCount = Math.ceil(totalCount / pageSize);

        const output = await postsQueryRepository.createPostsPaginator(
            foundPosts, pageNumber, pageSize, pagesCount, totalCount
        );

        res.json(output);
    },
    createBlogPost: async (req: RequestWithParamsAndBody<URIParamsPostBlogIdModel, CreateBlogPostInputModel>,
                             res: Response<PostViewModel>) => {
        const createdPostId = await postsService.createPost(
            req.body.title, req.body.shortDescription, req.body.content, req.params.blogId
        );
        if (!createdPostId) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        const createdPost = await postsQueryRepository.findPostById(createdPostId);
        if (!createdPost) {
            res.sendStatus(HTTP_STATUSES.INTERNAL_SERVER_ERROR_500);
            return;
        }

        res
            .status(HTTP_STATUSES.CREATED_201)
            .json(createdPost);
    },
};