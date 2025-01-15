import {RequestWithBody} from "../../types/types";
import {Response} from "express";
import {authService} from "./auth.service";
import {HTTP_STATUSES} from "../../utils";

import {LoginInputModel, LoginSuccessViewModel} from "./types/auth.types";

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
};