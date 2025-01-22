import {Request, Response, Router} from 'express';
import {HTTP_STATUSES} from "../utils";
import {blogsService} from "../features/blogs/blogs.service";
import {postsService} from "../features/posts/posts.service";
import {usersService} from "../features/users/users.service";
import {commentsService} from "../features/comments/comments.service";
import {RequestWithBody} from "../types/types";
import {nodemailerService} from "../application/nodemailer.service";
import {emailManager} from "../application/email.manager";

const router = Router();

router.delete('/all-data', async (req: Request, res: Response) => {
    await blogsService.deleteAllBlogs();
    await postsService.deleteAllPosts();
    await usersService.deleteAllUsers();
    await commentsService.deleteAllComments();

    res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
});
router.post('/mail', async (req: RequestWithBody<{ email: string }>,
                            res: Response) => {
    try {
        await emailManager.sendRegistrationMessage(
            req.body.email,
            'CODE',);
    }
    catch (err) {
        console.error('Send email error', err);
    }

    res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
});

export { router as testsRouter };