import {Router} from "express";
import {
    bearerAuthorizationMiddleware,
    optionalBearerAuthorizationMiddleware
} from "../../middlewares/bearer-authorization-middleware";
import {contentCommentFieldValidator} from "../../validation/field-validators/comments-field-validators";
import {errorsResultMiddleware} from "../../validation/errors-result-middleware";
import {commentIdUriParamValidator, idUriParamValidator} from "../../validation/uri-params-validators";
import {uriParamsValidationErrorMiddleware} from "../../validation/uri-params-validation-error-middleware";
import {container} from "../../composition-root";
import {CommentsController} from "./comments.controller";
import {likeStatusValidator} from "./validation/like-validators";

const commentsController = container.get<CommentsController>(CommentsController);

const router = Router();

router.get('/:id',
    optionalBearerAuthorizationMiddleware,
    idUriParamValidator,
    uriParamsValidationErrorMiddleware,
    commentsController.getComment.bind(commentsController));
router.delete('/:id',
    bearerAuthorizationMiddleware,
    idUriParamValidator,
    uriParamsValidationErrorMiddleware,
    commentsController.deleteComment.bind(commentsController));
router.put('/:id',
    bearerAuthorizationMiddleware,
    idUriParamValidator,
    uriParamsValidationErrorMiddleware,
    contentCommentFieldValidator,
    errorsResultMiddleware,
    commentsController.updateComment.bind(commentsController));
router.put('/:commentId/like-status',
    bearerAuthorizationMiddleware,
    commentIdUriParamValidator,
    uriParamsValidationErrorMiddleware,
    likeStatusValidator,
    errorsResultMiddleware,
    commentsController.updateCommentLikeStatus.bind(commentsController));

export { router as commentsRouter };