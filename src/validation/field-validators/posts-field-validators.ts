import {body} from "express-validator";
import {blogsQueryRepository} from "../../features/blogs/repositories/blogs.query.repository";

export const titleFieldValidator = body('title')
    .exists().withMessage('Title is required')
    .isString().withMessage('Title must be a string')
    .trim().notEmpty().withMessage('Title must not be empty')
    .isLength({ max: 30 }).withMessage('Title length must be between 1 and 30 symbols');

export const shortDescriptionFieldValidator = body('shortDescription')
    .exists().withMessage('Short description is required')
    .isString().withMessage('Short description must be a string')
    .trim().notEmpty().withMessage('Short description must not be empty')
    .isLength({ max: 100 }).withMessage('Short description length must be between 1 and 100 symbols');

export const contentFieldValidator = body('content')
    .exists().withMessage('Content is required')
    .isString().withMessage('Content must be a string')
    .trim().notEmpty().withMessage('Content must not be empty')
    .isLength({ max: 1000 }).withMessage('Content length must be between 1 and 1000 symbols');

export const blogIdFieldValidator = body('blogId')
    .exists().withMessage('Blog id is required')
    .isString().withMessage('Blog id must be a string')
    .trim().notEmpty().withMessage('Blog id must not be empty')
    .custom(async (value) => {
        const blog = await blogsQueryRepository.findBlogById(value);
        return blog ? Promise.resolve() : Promise.reject();
    }).withMessage('Blog does not exist');