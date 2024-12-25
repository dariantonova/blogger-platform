import {query} from "express-validator";

export const pageNumberQueryParamValidator = query('pageNumber')
    .optional()
    .isInt({ min: 1 }).withMessage('Page number must be a positive integer');

export const pageSizeQueryParamValidator = query('pageSize')
    .optional()
    .isInt({ min: 1 }).withMessage('Page size must be a positive integer');