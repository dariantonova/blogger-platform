import {Router} from 'express';
import {basicAuthorizationMiddleware} from "../../middlewares/basic-authorization-middleware";
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
import {container} from "../../composition-root";
import {BlogsController} from "./blogs.controller";
import {optionalBearerAuthorizationMiddleware} from "../../middlewares/bearer-authorization-middleware";

const blogsController = container.get<BlogsController>(BlogsController);

const router = Router();

router.get('/',
    pageNumberQueryParamValidator,
    pageSizeQueryParamValidator,
    queryValidationErrorMiddleware,
    blogsController.getBlogs.bind(blogsController));
router.get('/:id',
    blogsController.getBlog.bind(blogsController));
router.delete('/:id',
    basicAuthorizationMiddleware,
    blogsController.deleteBlog.bind(blogsController));
router.post('/',
    basicAuthorizationMiddleware,
    nameFieldValidator,
    descriptionFieldValidator,
    websiteUrlFieldValidator,
    errorsResultMiddleware,
    blogsController.createBlog.bind(blogsController));
router.put('/:id',
    basicAuthorizationMiddleware,
    nameFieldValidator,
    descriptionFieldValidator,
    websiteUrlFieldValidator,
    errorsResultMiddleware,
    blogsController.updateBlog.bind(blogsController));
router.get('/:blogId/posts',
    optionalBearerAuthorizationMiddleware,
    pageNumberQueryParamValidator,
    pageSizeQueryParamValidator,
    queryValidationErrorMiddleware,
    blogsController.getBlogPosts.bind(blogsController));
router.post('/:blogId/posts',
    basicAuthorizationMiddleware,
    titleFieldValidator,
    shortDescriptionFieldValidator,
    contentFieldValidator,
    errorsResultMiddleware,
    blogsController.createBlogPost.bind(blogsController));

export { router as blogsRouter };