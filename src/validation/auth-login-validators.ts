import {body} from "express-validator";

export const loginOrEmailAuthValidator = body('loginOrEmail')
    .exists().withMessage('A login or email is required')
    .isString().withMessage('Login or email must be a string')
    .trim().notEmpty().withMessage('Login or email must not be empty');

export const passwordAuthValidator = body('password')
    .exists().withMessage('Password is required')
    .isString().withMessage('Password must be a string')
    .trim().notEmpty().withMessage('Password must not be empty');