import {NextFunction, Request, Response} from "express";
import {Paginator} from "../types/types";
import {validationResult} from "express-validator";

export const queryValidationErrorMiddleware = (req: Request,
                                               res: Response<Paginator<any>>, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const output = new Paginator<any>(
            [],
            0,
            0,
            0,
            0
        );

        res.json(output);
        return;
    }

    next();
};