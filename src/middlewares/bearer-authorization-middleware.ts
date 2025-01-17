import {Request, Response, NextFunction} from "express";
import {HTTP_STATUSES} from "../utils";
import {jwtService} from "../application/jwt.service";
import {usersService} from "../features/users/users.service";

export const bearerAuthorizationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.sendStatus(HTTP_STATUSES.UNAUTHORIZED_401);
        return;
    }

    const token = authHeader.split(' ')[1];

    const userId = await jwtService.getUserIdByToken(token);
    if (!userId) {
        res.sendStatus(HTTP_STATUSES.UNAUTHORIZED_401);
        return;
    }

    const user = await usersService.findUserById(userId);
    if (!user) {
        res.sendStatus(HTTP_STATUSES.UNAUTHORIZED_401);
        return;
    }
    req.user = user;

    next();
};