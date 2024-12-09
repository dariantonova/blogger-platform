import {Router, Request, Response} from 'express';
import {blogsRepository} from "../features/blogs/blogs.repository";
import {postsRepository} from "../features/posts/posts.repository";
import {HTTP_STATUSES} from "../utils";

const router = Router();

router.delete('/all-data', (req: Request, res: Response) => {
    blogsRepository.deleteAllBlogs();
    postsRepository.deleteAllPosts();

    res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
});

export { router as testsRouter };