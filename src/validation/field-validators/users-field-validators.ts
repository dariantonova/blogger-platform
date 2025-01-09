import {body} from "express-validator";

const loginPattern = '^[a-zA-Z0-9_-]*$';
const emailPattern = '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$';

export const loginFieldValidator = body('login')
    .exists().withMessage('Login is required')
    .isString().withMessage('Login must be a string')
    .trim().notEmpty().withMessage('Login must not be empty')
    .isLength({ min: 3, max: 10 }).withMessage('Login length must be between 3 and 10 symbols')
    .matches(loginPattern).withMessage('Login must match the following pattern: ' + loginPattern);

export const passwordFieldValidator = body('password')
    .exists().withMessage('Password is required')
    .isString().withMessage('Password must be a string')
    .trim().notEmpty().withMessage('Password must not be empty')
    .isLength({ min: 6, max: 20 }).withMessage('Password length must be between 6 and 20 symbols');

export const emailFieldValidator = body('email')
    .exists().withMessage('Email is required')
    .isString().withMessage('Email must be a string')
    .trim().notEmpty().withMessage('Email must not be empty')
    .matches(emailPattern).withMessage('Email must match the following pattern: ' + emailPattern);