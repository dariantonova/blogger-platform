import {BlogDBType, RequestWithBody, RequestWithParams} from "../../types";
import {BlogViewModel} from "./models/BlogViewModel";
import {Request, Response} from "express";
import {blogsRepository} from "./blogs.repository";
import {URIParamsBlogIdModel} from "./models/URIParamsBlogIdModel";
import {HTTP_STATUSES} from "../../utils";
import {CreateBlogInputModel} from "./models/CreateBlogInputModel";

export const mapBlogToViewModel = (dbBlog: BlogDBType): BlogViewModel => {
    return {
        id: dbBlog.id,
        name: dbBlog.name,
        description: dbBlog.description,
        websiteUrl: dbBlog.websiteUrl,
    };
};

export const blogsController = {
    getBlogs: (req: Request, res: Response<BlogViewModel[]>) => {
        const foundBlogs = blogsRepository.findBlogs();

        res.json(foundBlogs.map(mapBlogToViewModel));
    },
    getBlog: (req: RequestWithParams<URIParamsBlogIdModel>,
              res: Response<BlogViewModel>) => {
        const foundBlog = blogsRepository.findBlogById(req.params.id);
        if (!foundBlog) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.json(mapBlogToViewModel(foundBlog));
    },
    deleteBlog: (req: RequestWithParams<URIParamsBlogIdModel>, res: Response) => {
        const isDeleted = blogsRepository.deleteBlog(req.params.id);
        if (!isDeleted) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    },
    createBlog: (req: RequestWithBody<CreateBlogInputModel>,
                 res: Response<BlogViewModel>) => {
        const createdBlog = blogsRepository.createBlog(
            req.body.name, req.body.description, req.body.websiteUrl
        );

        res
            .status(HTTP_STATUSES.CREATED_201)
            .json(mapBlogToViewModel(createdBlog));
    },
};