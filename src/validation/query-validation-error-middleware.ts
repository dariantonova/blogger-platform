import {NextFunction, Request, Response} from "express";
import {Paginator} from "../types/types";
import {validationResult} from "express-validator";

export const queryValidationErrorMiddleware = (req: Request,
                                               res: Response<Paginator<any>>, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const output: Paginator<any> = {
            pagesCount: 0,
            page: 0,
            pageSize: 0,
            totalCount: 0,
            items: [],
        };

        res.json(output);
        return;
    }

    next();
};