import {Router} from "express";
import {postsController} from "./posts.controller";

const router = Router();

router.get('/',
    postsController.getPosts);
router.get('/:id',
    postsController.getPost);

export { router as postsRouter };