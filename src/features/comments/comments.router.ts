import {Router} from "express";
import {commentsController} from "./comments.controller";
import {bearerAuthorizationMiddleware} from "../../middlewares/bearer-authorization-middleware";
import {contentCommentFieldValidator} from "../../validation/field-validators/comments-field-validators";
import {errorsResultMiddleware} from "../../validation/errors-result-middleware";
import {idUriParamValidator} from "../../validation/uri-params-validators";
import {uriParamsValidationErrorMiddleware} from "../../validation/uri-params-validation-error-middleware";

const router = Router();

router.get('/:id',
    idUriParamValidator,
    uriParamsValidationErrorMiddleware,
    commentsController.getComment);
router.delete('/:id',
    bearerAuthorizationMiddleware,
    idUriParamValidator,
    uriParamsValidationErrorMiddleware,
    commentsController.deleteComment);
router.put('/:id',
    bearerAuthorizationMiddleware,
    idUriParamValidator,
    uriParamsValidationErrorMiddleware,
    contentCommentFieldValidator,
    errorsResultMiddleware,
    commentsController.updateComment);

export { router as commentsRouter };