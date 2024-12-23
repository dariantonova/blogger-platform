import {BlogDBType, RequestWithBody, RequestWithParams, RequestWithParamsAndBody} from "../../types";
import {BlogViewModel} from "./models/BlogViewModel";
import {Request, Response} from "express";
import {URIParamsBlogIdModel} from "./models/URIParamsBlogIdModel";
import {HTTP_STATUSES} from "../../utils";
import {CreateBlogInputModel} from "./models/CreateBlogInputModel";
import {UpdateBlogInputModel} from "./models/UpdateBlogInputModel";
import {blogsService} from "./blogs.service";

export const mapBlogToViewModel = (dbBlog: BlogDBType): BlogViewModel => {
    return {
        id: dbBlog.id,
        name: dbBlog.name,
        description: dbBlog.description,
        websiteUrl: dbBlog.websiteUrl,
        createdAt: dbBlog.createdAt,
        isMembership: dbBlog.isMembership,
    };
};

export const blogsController = {
    getBlogs: async (req: Request, res: Response<BlogViewModel[]>) => {
        const foundBlogs =  await blogsService.findBlogs();

        res.json(foundBlogs.map(mapBlogToViewModel));
    },
    getBlog: async (req: RequestWithParams<URIParamsBlogIdModel>,
              res: Response<BlogViewModel>) => {
        const foundBlog = await blogsService.findBlogById(req.params.id);
        if (!foundBlog) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.json(mapBlogToViewModel(foundBlog));
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
            .json(mapBlogToViewModel(createdBlog));
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