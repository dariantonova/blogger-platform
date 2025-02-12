import {body} from "express-validator";

export const loginOrEmailAuthValidator = body('loginOrEmail')
    .exists().withMessage('A login or email is required')
    .isString().withMessage('Login or email must be a string')
    .trim().notEmpty().withMessage('Login or email must not be empty');

export const passwordAuthValidator = body('password')
    .exists().withMessage('Password is required')
    .isString().withMessage('Password must be a string')
    .trim().notEmpty().withMessage('Password must not be empty');

export const confirmationCodeValidator = body('code')
    .exists().withMessage('Code is required')
    .isString().withMessage('Code must be a string')
    .trim().notEmpty().withMessage('Code must not be empty');

export const passwordRecoveryCodeValidator = body('recoveryCode')
    .exists().withMessage('Recovery code is required')
    .isString().withMessage('Recovery code must be a string')
    .trim().notEmpty().withMessage('Recovery code must not be empty');