import {body} from "express-validator";

export const WEBSITE_URL_PATTERN = '^https:\\/\\/([a-zA-Z0-9_-]+\\.)+[a-zA-Z0-9_-]+(\\/[a-zA-Z0-9_-]+)*\\/?$';

export const nameFieldValidator = body('name')
    .exists().withMessage('Name is required')
    .isString().withMessage('Name must be a string')
    .trim().notEmpty().withMessage('Name must not be empty')
    .isLength({ max: 15 }).withMessage('Name length must be between 1 and 15 symbols');

export const descriptionFieldValidator = body('description')
    .exists().withMessage('Description is required')
    .isString().withMessage('Description must be a string')
    .trim().notEmpty().withMessage('Description must not be empty')
    .isLength({ max: 500 }).withMessage('Description length must be between 1 and 500 symbols');

export const websiteUrlFieldValidator = body('websiteUrl')
    .exists().withMessage('Website url is required')
    .isString().withMessage('Website url must be a string')
    .trim().notEmpty().withMessage('Website url must not be empty')
    .isLength({ max: 100 }).withMessage('Website url length must be between 1 and 100 symbols')
    .matches(WEBSITE_URL_PATTERN).withMessage('Website url must match the following pattern: ' + WEBSITE_URL_PATTERN);