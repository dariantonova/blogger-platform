import {Request, Response, NextFunction} from "express";
import {HTTP_STATUSES} from "../utils";
import {container} from "../composition-root";
import {AttemptsService} from "../application/attempts.service";

const attemptsService = container.get<AttemptsService>(AttemptsService);

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
    await attemptsService.createAttempt(ip, url);

    const fromDate = new Date(Date.now() - requestsLimit.interval);

    const numberOfRecentAttempts = await attemptsService.countAttemptsFromDate(ip, url, fromDate);
    if (numberOfRecentAttempts > requestsLimit.numberOfAttemptsLimit) {
        res.sendStatus(HTTP_STATUSES.TOO_MANY_REQUESTS_429);
        return;
    }

    next();
};