import {Router} from "express";
import {pageNumberQueryParamValidator, pageSizeQueryParamValidator} from "../../validation/query-params-validators";
import {basicAuthorizationMiddleware} from "../../middlewares/basic-authorization-middleware";
import {
    emailFieldValidator,
    loginFieldValidator,
    passwordFieldValidator
} from "../../validation/field-validators/users-field-validators";
import {errorsResultMiddleware} from "../../validation/errors-result-middleware";
import {queryValidationErrorMiddleware} from "../../validation/query-validation-error-middleware";
import {container} from "../../composition-root";
import {UsersController} from "./users.controller";

const usersController = container.get<UsersController>(UsersController);

const router = Router();

router.get('/',
    basicAuthorizationMiddleware,
    pageNumberQueryParamValidator,
    pageSizeQueryParamValidator,
    queryValidationErrorMiddleware,
    usersController.getUsers.bind(usersController));
router.post('/',
    basicAuthorizationMiddleware,
    loginFieldValidator,
    passwordFieldValidator,
    emailFieldValidator,
    errorsResultMiddleware,
    usersController.createUser.bind(usersController));
router.delete('/:id',
    basicAuthorizationMiddleware,
    usersController.deleteUser.bind(usersController));

export { router as usersRouter };