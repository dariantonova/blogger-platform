import {Router} from 'express';
import {authorizationMiddleware} from "../../middlewares/authorization-middleware";
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
} from "../../validation/query-params-validators/blogs-query-params-validators";

const router = Router();

router.get('/',
    pageNumberQueryParamValidator,
    pageSizeQueryParamValidator,
    blogsController.getBlogs);
router.get('/:id',
    blogsController.getBlog);
router.delete('/:id',
    authorizationMiddleware,
    blogsController.deleteBlog);
router.post('/',
    authorizationMiddleware,
    nameFieldValidator,
    descriptionFieldValidator,
    websiteUrlFieldValidator,
    errorsResultMiddleware,
    blogsController.createBlog);
router.put('/:id',
    authorizationMiddleware,
    nameFieldValidator,
    descriptionFieldValidator,
    websiteUrlFieldValidator,
    errorsResultMiddleware,
    blogsController.updateBlog);

export { router as blogsRouter };