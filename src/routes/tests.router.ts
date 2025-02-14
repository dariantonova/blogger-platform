import {Request, Response, Router} from 'express';
import {HTTP_STATUSES} from "../utils";
import {RequestWithBody} from "../types/types";
import {container} from "../composition-root";
import {AttemptsService} from "../application/attempts.service";
import {AuthService} from "../features/auth/auth.service";
import {BlogsService} from "../features/blogs/blogs.service";
import {CommentsService} from "../features/comments/comments.service";
import {EmailManager} from "../application/email.manager";
import {PostsService} from "../features/posts/posts.service";
import {UsersService} from "../features/users/users.service";

const attemptsService = container.get<AttemptsService>(AttemptsService);
const authService = container.get<AuthService>(AuthService);
const blogsService = container.get<BlogsService>(BlogsService);
const commentsService = container.get<CommentsService>(CommentsService);
const emailManager = container.get<EmailManager>(EmailManager);
const postsService = container.get<PostsService>(PostsService);
const usersService = container.get<UsersService>(UsersService);

const router = Router();

router.delete('/all-data', async (req: Request, res: Response) => {
    await blogsService.deleteAllBlogs();
    await postsService.deleteAllPosts();
    await usersService.deleteAllUsers();
    await commentsService.deleteAllComments();
    await authService.deleteAllDeviceAuthSessions();
    await attemptsService.deleteAllAttempts();
    // todo: delete all comment likes

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
router.get('/create', async (req: Request, res: Response) => {
    const refreshToken = 'cool-token';
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        maxAge: 2592000000,
        path: '/',
    });
    res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
});
router.get('/delete', async (req: Request, res: Response) => {
    res.clearCookie('refreshToken', { path: '/' });
    res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
});

export { router as testsRouter };