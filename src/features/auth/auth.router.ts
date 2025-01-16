import {Router} from "express";
import {
    loginOrEmailAuthValidator,
    passwordAuthValidator
} from "../../validation/field-validators/auth-login-field-validators";
import {errorsResultMiddleware} from "../../validation/errors-result-middleware";
import {authController} from "./auth.controller";
import {bearerAuthorizationMiddleware} from "../../middlewares/bearer-authorization-middleware";

const router = Router();

router.post('/login',
    loginOrEmailAuthValidator,
    passwordAuthValidator,
    errorsResultMiddleware,
    authController.loginUser);
router.get('/me',
    bearerAuthorizationMiddleware,
    authController.getCurrentUserInfo);

export { router as authRouter };