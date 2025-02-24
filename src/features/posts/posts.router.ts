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
import {
    bearerAuthorizationMiddleware,
    optionalBearerAuthorizationMiddleware
} from "../../middlewares/bearer-authorization-middleware";
import {contentCommentFieldValidator} from "../../validation/field-validators/comments-field-validators";
import {queryValidationErrorMiddleware} from "../../validation/query-validation-error-middleware";
import {container} from "../../composition-root";
import {PostsController} from "./posts.controller";
import {likeStatusValidator} from "../comments/validation/like-validators";

const postsController = container.get<PostsController>(PostsController);

const router = Router();

router.get('/',
    optionalBearerAuthorizationMiddleware,
    pageNumberQueryParamValidator,
    pageSizeQueryParamValidator,
    queryValidationErrorMiddleware,
    postsController.getPosts.bind(postsController));
router.get('/:id',
    optionalBearerAuthorizationMiddleware,
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
    optionalBearerAuthorizationMiddleware,
    pageNumberQueryParamValidator,
    pageSizeQueryParamValidator,
    queryValidationErrorMiddleware,
    postsController.getPostComments.bind(postsController));
router.put('/:postId/like-status',
    bearerAuthorizationMiddleware,
    likeStatusValidator,
    errorsResultMiddleware,
    postsController.updatePostLikeStatus.bind(postsController));

export { router as postsRouter };