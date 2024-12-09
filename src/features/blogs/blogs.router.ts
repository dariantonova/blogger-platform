import {Router, Request, Response} from 'express';
import {blogsRepository} from "./blogs.repository";
import {BlogType} from "../../types";
import {BlogViewModel} from "./models/BlogViewModel";

const mapBlogToViewModel = (dbBlog: BlogType): BlogViewModel => {
    return {
        id: dbBlog.id,
        name: dbBlog.name,
        description: dbBlog.description,
        websiteUrl: dbBlog.websiteUrl,
    };
};

const router = Router();

router.get('/', (req: Request, res: Response) => {
    const foundBlogs = blogsRepository.findBlogs();

    res.json(foundBlogs.map(mapBlogToViewModel));
});

export { router as blogsRouter };