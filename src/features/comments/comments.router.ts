import {Router} from "express";
import {commentsController} from "./comments.controller";
import {bearerAuthorizationMiddleware} from "../../middlewares/bearer-authorization-middleware";
import {contentCommentFieldValidator} from "../../validation/field-validators/comments-field-validators";
import {errorsResultMiddleware} from "../../validation/errors-result-middleware";
import {idUriParamValidator} from "../../validation/uri-params-validators";
import {paramsValidationErrorMiddleware} from "../../validation/params-validation-error-middleware";

const router = Router();

router.get('/:id',
    idUriParamValidator,
    paramsValidationErrorMiddleware,
    commentsController.getComment);
router.delete('/:id',
    bearerAuthorizationMiddleware,
    idUriParamValidator,
    paramsValidationErrorMiddleware,
    commentsController.deleteComment);
router.put('/:id',
    bearerAuthorizationMiddleware,
    idUriParamValidator,
    paramsValidationErrorMiddleware,
    contentCommentFieldValidator,
    errorsResultMiddleware,
    commentsController.updateComment);

export { router as commentsRouter };