import {Router, Request, Response} from 'express';
import {blogsRepository} from "../features/blogs/blogs.db.repository";
import {postsRepository} from "../features/posts/posts.db.repository";
import {HTTP_STATUSES} from "../utils";

const router = Router();

router.delete('/all-data', async (req: Request, res: Response) => {
    await blogsRepository.deleteAllBlogs();
    await postsRepository.deleteAllPosts();

    res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
});

export { router as testsRouter };