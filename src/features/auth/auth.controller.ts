import {RequestWithBody} from "../../types";
import {Response} from "express";
import {authService} from "./auth.service";
import {HTTP_STATUSES} from "../../utils";
import {LoginInputModel} from "./models/LoginInputModel";

export const authController = {
    login: async (req: RequestWithBody<LoginInputModel>, res: Response) => {
        const isAuthenticated = await authService.checkCredentials(
            req.body.loginOrEmail, req.body.password
        );
        if (!isAuthenticated) {
            res.sendStatus(HTTP_STATUSES.UNAUTHORIZED_401);
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    },
};