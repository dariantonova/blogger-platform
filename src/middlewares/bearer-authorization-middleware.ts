import {NextFunction, Request, Response} from "express";
import {HTTP_STATUSES} from "../utils";
import {ResultStatus} from "../common/result/resultStatus";
import {container} from "../composition-root";
import {AuthService} from "../features/auth/auth.service";

const authService = container.get<AuthService>(AuthService);

export const bearerAuthorizationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.sendStatus(HTTP_STATUSES.UNAUTHORIZED_401);
        return;
    }

    const token = authHeader.split(' ')[1];

    const verificationResult = await authService.verifyAccessToken(token);
    if (verificationResult.status !== ResultStatus.SUCCESS) {
        res.sendStatus(HTTP_STATUSES.UNAUTHORIZED_401);
        return;
    }

    req.user = verificationResult.data;

    next();
};