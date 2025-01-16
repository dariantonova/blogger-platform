import {RequestWithBody, UserDBType} from "../../types/types";
import {Request, Response} from "express";
import {authService} from "./auth.service";
import {HTTP_STATUSES} from "../../utils";

import {LoginInputModel, LoginSuccessViewModel, MeViewModel} from "./types/auth.types";

export const authController = {
    loginUser: async (req: RequestWithBody<LoginInputModel>,
                      res: Response<LoginSuccessViewModel>) => {
        const result = await authService.loginUser(
            req.body.loginOrEmail, req.body.password
        );

        if (!result) {
            res.sendStatus(HTTP_STATUSES.UNAUTHORIZED_401);
            return;
        }

        res.json({
            accessToken: result.accessToken,
        });
    },
    getCurrentUserInfo: async (req: Request, res: Response<MeViewModel>) => {
        const user = req.user as UserDBType;
        const userInfo: MeViewModel = {
            email: user.email,
            login: user.login,
            userId: user.id,
        };
        res.json(userInfo);
    },
};