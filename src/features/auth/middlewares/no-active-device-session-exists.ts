import {NextFunction, Request, Response} from "express";
import {HTTP_STATUSES} from "../../../utils";
import {ResultStatus} from "../../../common/result/resultStatus";
import {container} from "../../../composition-root";
import {AuthService} from "../auth.service";

const authService = container.get<AuthService>(AuthService);

export const noActiveDeviceSessionExists = async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
        const verificationResult = await authService.verifyRefreshToken(refreshToken);
        if (verificationResult.status === ResultStatus.SUCCESS) {
            res.sendStatus(HTTP_STATUSES.TOO_MANY_REQUESTS_429);
            return;
        }
    }

    next();
};