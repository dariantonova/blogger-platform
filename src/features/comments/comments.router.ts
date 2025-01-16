import {Router} from "express";
import {commentsController} from "./comments.controller";
import {bearerAuthorizationMiddleware} from "../../middlewares/bearer-authorization-middleware";
import {contentCommentFieldValidator} from "../../validation/field-validators/comments-field-validators";
import {errorsResultMiddleware} from "../../validation/errors-result-middleware";

const router = Router();

router.get('/:id',
    commentsController.getComment);
router.delete('/:id',
    bearerAuthorizationMiddleware,
    commentsController.deleteComment);
router.put('/:id',
    bearerAuthorizationMiddleware,
    contentCommentFieldValidator,
    errorsResultMiddleware,
    commentsController.updateComment);

export { router as commentsRouter };