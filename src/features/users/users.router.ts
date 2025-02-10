import {Router} from "express";
import {usersController} from "./users.controller";
import {pageNumberQueryParamValidator, pageSizeQueryParamValidator} from "../../validation/query-params-validators";
import {basicAuthorizationMiddleware} from "../../middlewares/basic-authorization-middleware";
import {
    emailFieldValidator,
    loginFieldValidator,
    passwordFieldValidator
} from "../../validation/field-validators/users-field-validators";
import {errorsResultMiddleware} from "../../validation/errors-result-middleware";
import {queryValidationErrorMiddleware} from "../../validation/query-validation-error-middleware";

const router = Router();

router.get('/',
    basicAuthorizationMiddleware,
    pageNumberQueryParamValidator,
    pageSizeQueryParamValidator,
    queryValidationErrorMiddleware,
    usersController.getUsers);
router.post('/',
    basicAuthorizationMiddleware,
    loginFieldValidator,
    passwordFieldValidator,
    emailFieldValidator,
    errorsResultMiddleware,
    usersController.createUser);
router.delete('/:id',
    basicAuthorizationMiddleware,
    usersController.deleteUser);

export { router as usersRouter };