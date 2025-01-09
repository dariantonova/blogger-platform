import {Router, Response} from "express";
import {RequestWithBody} from "../types";
import {usersService} from "../features/users/users.service";
import {HTTP_STATUSES} from "../utils";
import {loginOrEmailAuthValidator, passwordAuthValidator} from "../validation/auth-login-validators";
import {errorsResultMiddleware} from "../validation/errors-result-middleware";

type LoginInputModel = {
    loginOrEmail: string,
    password: string,
};

const router = Router();

router.post('/login',
    loginOrEmailAuthValidator,
    passwordAuthValidator,
    errorsResultMiddleware,
    async (req: RequestWithBody<LoginInputModel>, res: Response) => {
    const isAuthenticated = await usersService.checkCredentials(
        req.body.loginOrEmail, req.body.password
    );
    if (!isAuthenticated) {
        res.sendStatus(HTTP_STATUSES.UNAUTHORIZED_401);
        return;
    }

    res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
});

export { router as authRouter };