import {Router} from 'express';
import {authorizationMiddleware} from "../../middlewares/authorization-middleware";
import {blogsController} from "./blogs.controller";

const router = Router();

router.get('/',
    blogsController.getBlogs);
router.get('/:id',
    blogsController.getBlog);
router.delete('/:id',
    authorizationMiddleware,
    blogsController.deleteBlog);

export { router as blogsRouter };