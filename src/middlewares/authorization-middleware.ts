import {Request, Response, NextFunction} from "express";
import {encodeToBase64, HTTP_STATUSES} from "../utils";
import {SETTINGS} from "../settings";

export const getValidAuthValue = () => {
    const credentials = `${SETTINGS.CREDENTIALS.LOGIN}:${SETTINGS.CREDENTIALS.PASSWORD}`;
    const encodedCredentials = encodeToBase64(credentials);
    return `Basic ${encodedCredentials}`;
}

export const authorizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const validAuthValue = getValidAuthValue();
    const authHeader = req.headers.authorization;
    if (authHeader === validAuthValue) {
        next();
    }
    else {
        res.sendStatus(HTTP_STATUSES.UNAUTHORIZED_401);
    }
};