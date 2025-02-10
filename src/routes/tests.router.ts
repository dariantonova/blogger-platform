import {Request, Response, Router} from 'express';
import {HTTP_STATUSES} from "../utils";
import {RequestWithBody} from "../types/types";
import {
    attemptsService,
    authService,
    blogsService,
    commentsService,
    emailManager,
    postsService,
    usersService
} from "../composition-root";

const router = Router();

router.delete('/all-data', async (req: Request, res: Response) => {
    await blogsService.deleteAllBlogs();
    await postsService.deleteAllPosts();
    await usersService.deleteAllUsers();
    await commentsService.deleteAllComments();
    await authService.deleteAllDeviceAuthSessions();
    await attemptsService.deleteAllAttempts();

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