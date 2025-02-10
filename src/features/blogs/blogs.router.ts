import {Router} from 'express';
import {basicAuthorizationMiddleware} from "../../middlewares/basic-authorization-middleware";
import {blogsController} from "./blogs.controller";
import {
    descriptionFieldValidator,
    nameFieldValidator,
    websiteUrlFieldValidator
} from "../../validation/field-validators/blogs-field-validators";
import {errorsResultMiddleware} from "../../validation/errors-result-middleware";
import {
    pageNumberQueryParamValidator,
    pageSizeQueryParamValidator
} from "../../validation/query-params-validators";
import {
    contentFieldValidator,
    shortDescriptionFieldValidator,
    titleFieldValidator
} from "../../validation/field-validators/posts-field-validators";
import {queryValidationErrorMiddleware} from "../../validation/query-validation-error-middleware";

const router = Router();

router.get('/',
    pageNumberQueryParamValidator,
    pageSizeQueryParamValidator,
    queryValidationErrorMiddleware,
    blogsController.getBlogs);
router.get('/:id',
    blogsController.getBlog);
router.delete('/:id',
    basicAuthorizationMiddleware,
    blogsController.deleteBlog);
router.post('/',
    basicAuthorizationMiddleware,
    nameFieldValidator,
    descriptionFieldValidator,
    websiteUrlFieldValidator,
    errorsResultMiddleware,
    blogsController.createBlog);
router.put('/:id',
    basicAuthorizationMiddleware,
    nameFieldValidator,
    descriptionFieldValidator,
    websiteUrlFieldValidator,
    errorsResultMiddleware,
    blogsController.updateBlog);
router.get('/:blogId/posts',
    pageNumberQueryParamValidator,
    pageSizeQueryParamValidator,
    queryValidationErrorMiddleware,
    blogsController.getBlogPosts);
router.post('/:blogId/posts',
    basicAuthorizationMiddleware,
    titleFieldValidator,
    shortDescriptionFieldValidator,
    contentFieldValidator,
    errorsResultMiddleware,
    blogsController.createBlogPost);

export { router as blogsRouter };