import {body} from "express-validator";

export const contentCommentFieldValidator = body('content')
    .exists().withMessage('Content is required')
    .isString().withMessage('Content must be a string')
    .trim().notEmpty().withMessage('Content must not be empty')
    .isLength({ min: 20, max: 300 }).withMessage('Content must be between 6 and 300 characters long');