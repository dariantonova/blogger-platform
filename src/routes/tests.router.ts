import {Router, Request, Response} from 'express';
import {blogsRepository} from "../features/blogs/blogs.in-memory.repository";
import {postsRepository} from "../features/posts/posts.in-memory.repository";
import {HTTP_STATUSES} from "../utils";

const router = Router();

router.delete('/all-data', (req: Request, res: Response) => {
    blogsRepository.deleteAllBlogs();
    postsRepository.deleteAllPosts();

    res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
});

export { router as testsRouter };