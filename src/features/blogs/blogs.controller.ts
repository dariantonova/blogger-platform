import {
    BlogDBType,
    Paginator,
    RequestWithBody,
    RequestWithParams,
    RequestWithParamsAndBody,
    RequestWithQuery
} from "../../types";
import {BlogViewModel} from "./models/BlogViewModel";
import {Response} from "express";
import {URIParamsBlogIdModel} from "./models/URIParamsBlogIdModel";
import {HTTP_STATUSES} from "../../utils";
import {CreateBlogInputModel} from "./models/CreateBlogInputModel";
import {UpdateBlogInputModel} from "./models/UpdateBlogInputModel";
import {blogsService} from "./blogs.service";
import {QueryBlogsModel} from "./models/QueryBlogsModel";
import {blogsQueryRepository} from "./repositories/blogs.query-repository";
import {getBlogsQueryParamsValues} from "../../helpers/query-params-values";
import {validationResult} from "express-validator";

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
        const {
            searchNameTerm,
            sortBy,
            sortDirection,
            pageSize,
            pageNumber
        } = getBlogsQueryParamsValues(req);

        const validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
            const output = createBlogsPaginator(
                [], 0, 0, 0, 0
            );
            res.json(output);
            return;
        }

        const foundBlogs =  await blogsQueryRepository.findBlogs(
            searchNameTerm, sortBy, sortDirection, pageNumber, pageSize
        );
        const totalCount = await blogsQueryRepository.countBlogs(searchNameTerm);
        const pagesCount = Math.ceil(totalCount / pageSize);

        const output = createBlogsPaginator(
            foundBlogs, pageNumber, pageSize, pagesCount, totalCount
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

        res.json(blogsQueryRepository.mapToOutput(foundBlog));
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
        const createdBlog = await blogsService.createBlog(
            req.body.name, req.body.description, req.body.websiteUrl
        );

        res
            .status(HTTP_STATUSES.CREATED_201)
            .json(blogsQueryRepository.mapToOutput(createdBlog));
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
};