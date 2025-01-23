import {APIErrorResult, RequestWithBody, UserDBType} from "../../types/types";
import {Request, Response} from "express";
import {authService} from "./auth.service";
import {HTTP_STATUSES} from "../../utils";

import {
    LoginInputModel,
    LoginSuccessViewModel,
    MeViewModel,
    RegistrationConfirmationCodeModel, RegistrationEmailResending
} from "./types/auth.types";
import {CreateUserInputModel} from "../users/models/CreateUserInputModel";
import {ResultStatus} from "../../common/result/resultStatus";
import {resultStatusToHttp} from "../../common/result/resultStatusToHttp";

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
    registerUser: async (req: RequestWithBody<CreateUserInputModel>,
                         res: Response<APIErrorResult>) => {
        const registerUserResult = await authService.registerUser(
            req.body.login, req.body.email, req.body.password
        );

        if (registerUserResult.status !== ResultStatus.SUCCESS) {
            const error: APIErrorResult = {
                errorsMessages: registerUserResult.extensions,
            };
            res
                .status(resultStatusToHttp(registerUserResult.status))
                .json(error);
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    },
    confirmRegistration: async (req: RequestWithBody<RegistrationConfirmationCodeModel>,
                                res: Response<APIErrorResult>) => {
        const confirmRegistrationResult = await authService.confirmRegistration(req.body.code);

        if (confirmRegistrationResult.status !== ResultStatus.SUCCESS) {
            const error: APIErrorResult = {
                errorsMessages: confirmRegistrationResult.extensions,
            };
            res
                .status(resultStatusToHttp(confirmRegistrationResult.status))
                .json(error);
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    },
    resendRegistrationEmail: async (req: RequestWithBody<RegistrationEmailResending>,
                                    res: Response<APIErrorResult>) => {
        const resendRegistrationEmailResult = await authService.resendRegistrationEmail(req.body.email);

        if (resendRegistrationEmailResult.status !== ResultStatus.SUCCESS) {
            const error: APIErrorResult = {
                errorsMessages: resendRegistrationEmailResult.extensions,
            };
            res
                .status(resultStatusToHttp(resendRegistrationEmailResult.status))
                .json(error);
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    },
};