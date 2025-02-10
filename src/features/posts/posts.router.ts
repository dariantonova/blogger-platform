import {Router} from "express";
import {basicAuthorizationMiddleware} from "../../middlewares/basic-authorization-middleware";
import {
    blogIdFieldValidator,
    contentFieldValidator,
    shortDescriptionFieldValidator,
    titleFieldValidator
} from "../../validation/field-validators/posts-field-validators";
import {errorsResultMiddleware} from "../../validation/errors-result-middleware";
import {pageNumberQueryParamValidator, pageSizeQueryParamValidator} from "../../validation/query-params-validators";
import {bearerAuthorizationMiddleware} from "../../middlewares/bearer-authorization-middleware";
import {contentCommentFieldValidator} from "../../validation/field-validators/comments-field-validators";
import {queryValidationErrorMiddleware} from "../../validation/query-validation-error-middleware";
import {postsController} from "../../composition-root";

const router = Router();

router.get('/',
    pageNumberQueryParamValidator,
    pageSizeQueryParamValidator,
    queryValidationErrorMiddleware,
    postsController.getPosts.bind(postsController));
router.get('/:id',
    postsController.getPost.bind(postsController));
router.delete('/:id',
    basicAuthorizationMiddleware,
    postsController.deletePost.bind(postsController));
router.post('/',
    basicAuthorizationMiddleware,
    titleFieldValidator,
    shortDescriptionFieldValidator,
    contentFieldValidator,
    blogIdFieldValidator,
    errorsResultMiddleware,
    postsController.createPost.bind(postsController));
router.put('/:id',
    basicAuthorizationMiddleware,
    titleFieldValidator,
    shortDescriptionFieldValidator,
    contentFieldValidator,
    blogIdFieldValidator,
    errorsResultMiddleware,
    postsController.updatePost.bind(postsController));
router.post('/:postId/comments',
    bearerAuthorizationMiddleware,
    contentCommentFieldValidator,
    errorsResultMiddleware,
    postsController.createPostComment.bind(postsController));
router.get('/:postId/comments',
    pageNumberQueryParamValidator,
    pageSizeQueryParamValidator,
    queryValidationErrorMiddleware,
    postsController.getPostComments.bind(postsController));

export { router as postsRouter };