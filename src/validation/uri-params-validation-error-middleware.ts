import {NextFunction, Request, Response} from "express";
import {Paginator} from "../types/types";
import {validationResult} from "express-validator";
import {HTTP_STATUSES} from "../utils";

export const uriParamsValidationErrorMiddleware = (req: Request,
                                                   res: Response<Paginator<any>>, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
        return;
    }

    next();
};