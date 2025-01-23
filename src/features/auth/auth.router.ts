import {Router} from "express";
import {
    loginOrEmailAuthValidator,
    passwordAuthValidator
} from "../../validation/field-validators/auth-login-field-validators";
import {errorsResultMiddleware} from "../../validation/errors-result-middleware";
import {authController} from "./auth.controller";
import {bearerAuthorizationMiddleware} from "../../middlewares/bearer-authorization-middleware";
import {
    emailFieldValidator,
    loginFieldValidator,
    passwordFieldValidator
} from "../../validation/field-validators/users-field-validators";

const router = Router();

router.post('/login',
    loginOrEmailAuthValidator,
    passwordAuthValidator,
    errorsResultMiddleware,
    authController.loginUser);
router.get('/me',
    bearerAuthorizationMiddleware,
    authController.getCurrentUserInfo);
router.post('/registration',
    loginFieldValidator,
    passwordFieldValidator,
    emailFieldValidator,
    errorsResultMiddleware,
    authController.registerUser);
router.post('/registration-confirmation',
    authController.confirmRegistration);

export { router as authRouter };