import {Router} from "express";
import {postsController} from "./posts.controller";

const router = Router();

router.get('/',
    postsController.getPosts);

export { router as postsRouter };