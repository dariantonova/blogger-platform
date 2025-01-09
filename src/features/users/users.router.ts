import {Router} from "express";
import {usersController} from "./users.controller";
import {pageNumberQueryParamValidator, pageSizeQueryParamValidator} from "../../validation/query-params-validators";
import {authorizationMiddleware} from "../../middlewares/authorization-middleware";

const router = Router();

router.get('/',
    authorizationMiddleware,
    pageNumberQueryParamValidator,
    pageSizeQueryParamValidator,
    usersController.getUsers);

export { router as usersRouter };