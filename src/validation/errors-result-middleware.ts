import {Request, Response, NextFunction} from "express";
import {ValidationError, validationResult} from "express-validator";
import {FieldValidationError} from "express-validator/lib/base";
import {FieldError} from "../types";
import {HTTP_STATUSES} from "../utils";

export const errorsResultMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorsMessages: FieldError[] = errors
            .array({ onlyFirstError: true })
            .map((err: ValidationError) => {
                return {
                    message: err.msg,
                    field: (err as FieldValidationError).path,
                };
            });

        res
            .status(HTTP_STATUSES.BAD_REQUEST_400)
            .json({ errorsMessages });
    }
    else {
        next();
    }
};