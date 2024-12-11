import {Router} from "express";
import {postsController} from "./posts.controller";
import {authorizationMiddleware} from "../../middlewares/authorization-middleware";

const router = Router();

router.get('/',
    postsController.getPosts);
router.get('/:id',
    postsController.getPost);
router.delete('/:id',
    authorizationMiddleware,
    postsController.deletePost);

export { router as postsRouter };