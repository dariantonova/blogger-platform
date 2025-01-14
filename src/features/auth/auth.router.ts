import {Router} from "express";
import {
    loginOrEmailAuthValidator,
    passwordAuthValidator
} from "../../validation/field-validators/auth-login-field-validators";
import {errorsResultMiddleware} from "../../validation/errors-result-middleware";
import {authController} from "./auth.controller";

const router = Router();

router.post('/login',
    loginOrEmailAuthValidator,
    passwordAuthValidator,
    errorsResultMiddleware,
    authController.login);

export { router as authRouter };