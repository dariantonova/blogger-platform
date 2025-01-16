import {Router} from "express";
import {commentsController} from "./comments.controller";

const router = Router();

router.get('/:id',
    commentsController.getComment);

export { router as commentsRouter };