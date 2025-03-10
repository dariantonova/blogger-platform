import {NextFunction, Request, Response} from "express";
import {ResultStatus} from "../../../common/result/resultStatus";
import {HTTP_STATUSES} from "../../../utils";
import {container} from "../../../composition-root";
import {AuthService} from "../auth.service";

const authService = container.get<AuthService>(AuthService);

export const refreshTokenVerification = async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        res.sendStatus(HTTP_STATUSES.UNAUTHORIZED_401);
        return;
    }

    const verificationResult = await authService.verifyRefreshToken(refreshToken);
    if (verificationResult.status !== ResultStatus.SUCCESS) {
        res.sendStatus(HTTP_STATUSES.UNAUTHORIZED_401);
        return;
    }

    req.user = verificationResult.data;

    next();
};