import {Router} from "express";
import {commentsController} from "./comments.controller";
import {bearerAuthorizationMiddleware} from "../../middlewares/bearer-authorization-middleware";

const router = Router();

router.get('/:id',
    commentsController.getComment);
router.delete('/:id',
    bearerAuthorizationMiddleware,
    commentsController.deleteComment);

export { router as commentsRouter };