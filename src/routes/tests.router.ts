import {Request, Response, Router} from 'express';
import {HTTP_STATUSES} from "../utils";
import {blogsService} from "../features/blogs/blogs.service";
import {postsService} from "../features/posts/posts.service";
import {usersService} from "../features/users/users.service";

const router = Router();

router.delete('/all-data', async (req: Request, res: Response) => {
    await blogsService.deleteAllBlogs();
    await postsService.deleteAllPosts();
    await usersService.deleteAllUsers();

    res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
});

export { router as testsRouter };