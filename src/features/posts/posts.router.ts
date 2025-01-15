import {Router} from "express";
import {postsController} from "./posts.controller";
import {basicAuthorizationMiddleware} from "../../middlewares/basic-authorization-middleware";
import {
    blogIdFieldValidator,
    contentFieldValidator,
    shortDescriptionFieldValidator,
    titleFieldValidator
} from "../../validation/field-validators/posts-field-validators";
import {errorsResultMiddleware} from "../../validation/errors-result-middleware";
import {pageNumberQueryParamValidator, pageSizeQueryParamValidator} from "../../validation/query-params-validators";

const router = Router();

router.get('/',
    pageNumberQueryParamValidator,
    pageSizeQueryParamValidator,
    postsController.getPosts);
router.get('/:id',
    postsController.getPost);
router.delete('/:id',
    basicAuthorizationMiddleware,
    postsController.deletePost);
router.post('/',
    basicAuthorizationMiddleware,
    titleFieldValidator,
    shortDescriptionFieldValidator,
    contentFieldValidator,
    blogIdFieldValidator,
    errorsResultMiddleware,
    postsController.createPost);
router.put('/:id',
    basicAuthorizationMiddleware,
    titleFieldValidator,
    shortDescriptionFieldValidator,
    contentFieldValidator,
    blogIdFieldValidator,
    errorsResultMiddleware,
    postsController.updatePost);

export { router as postsRouter };