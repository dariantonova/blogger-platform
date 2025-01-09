import {Router} from "express";
import {usersController} from "./users.controller";
import {pageNumberQueryParamValidator, pageSizeQueryParamValidator} from "../../validation/query-params-validators";
import {authorizationMiddleware} from "../../middlewares/authorization-middleware";
import {
    emailFieldValidator,
    loginFieldValidator,
    passwordFieldValidator
} from "../../validation/field-validators/users-field-validators";
import {errorsResultMiddleware} from "../../validation/errors-result-middleware";

const router = Router();

router.get('/',
    authorizationMiddleware,
    pageNumberQueryParamValidator,
    pageSizeQueryParamValidator,
    usersController.getUsers);
router.post('/',
    authorizationMiddleware,
    loginFieldValidator,
    passwordFieldValidator,
    emailFieldValidator,
    errorsResultMiddleware,
    usersController.createUser);
router.delete('/:id',
    authorizationMiddleware,
    usersController.deleteUser);

export { router as usersRouter };