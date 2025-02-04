import {Request, Response, NextFunction} from "express";
import {HTTP_STATUSES} from "../utils";
import {attemptsService} from "../application/attempts.service";

export const requestsLimit = {
    interval: 10 * 1000,
    numberOfAttemptsLimit: 5,
};

export const rateLimitingMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip;
    if (!ip) {
        res.sendStatus(HTTP_STATUSES.FORBIDDEN_403);
        return;
    }

    const url = req.originalUrl;
    const numberOfRecentAttempts = await attemptsService.countRecentAttempts(ip, url, requestsLimit.interval);
    if (numberOfRecentAttempts >= requestsLimit.numberOfAttemptsLimit) {
        res.sendStatus(HTTP_STATUSES.TOO_MANY_REQUESTS_429);
        return;
    }

    await attemptsService.createAttempt(ip, url);

    next();
};