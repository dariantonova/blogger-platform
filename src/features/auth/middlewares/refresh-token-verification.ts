import {NextFunction, Request, Response} from "express";
import {authService} from "../auth.service";
import {ResultStatus} from "../../../common/result/resultStatus";
import {HTTP_STATUSES} from "../../../utils";

export const refreshTokenVerification = async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;

    const verificationResult = await authService.verifyRefreshToken(refreshToken);
    if (verificationResult.status !== ResultStatus.SUCCESS) {
        res.sendStatus(HTTP_STATUSES.UNAUTHORIZED_401);
        return;
    }

    req.user = verificationResult.data;

    next();
};