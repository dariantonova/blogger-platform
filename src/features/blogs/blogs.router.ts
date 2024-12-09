import {Router, Request, Response} from 'express';
import {blogsRepository} from "./blogs.repository";
import {BlogType, RequestWithParams} from "../../types";
import {BlogViewModel} from "./models/BlogViewModel";
import {URIParamsBlogIdModel} from "./models/URIParamsBlogIdModel";
import {HTTP_STATUSES} from "../../utils";

const mapBlogToViewModel = (dbBlog: BlogType): BlogViewModel => {
    return {
        id: dbBlog.id,
        name: dbBlog.name,
        description: dbBlog.description,
        websiteUrl: dbBlog.websiteUrl,
    };
};

const router = Router();

router.get('/',
    (req: Request, res: Response<BlogViewModel[]>) => {
    const foundBlogs = blogsRepository.findBlogs();

    res.json(foundBlogs.map(mapBlogToViewModel));
});
router.get('/:id',
    (req: RequestWithParams<URIParamsBlogIdModel>,
     res: Response<BlogViewModel>) => {
    const foundBlog = blogsRepository.findBlogById(req.params.id);
    if (!foundBlog) {
        res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
        return;
    }

    res.json(mapBlogToViewModel(foundBlog));
});

export { router as blogsRouter };