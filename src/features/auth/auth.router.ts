import {Router} from "express";
import {
    confirmationCodeValidator,
    loginOrEmailAuthValidator,
    passwordAuthValidator
} from "../../validation/field-validators/auth-field-validators";
import {errorsResultMiddleware} from "../../validation/errors-result-middleware";
import {authController} from "./auth.controller";
import {bearerAuthorizationMiddleware} from "../../middlewares/bearer-authorization-middleware";
import {
    emailFieldValidator,
    loginFieldValidator,
    passwordFieldValidator
} from "../../validation/field-validators/users-field-validators";
import {refreshTokenVerification} from "./middlewares/refresh-token-verification";
import {rateLimitingMiddleware} from "../../middlewares/rate-limiting-middleware";

const router = Router();

router.post('/login',
    rateLimitingMiddleware,
    loginOrEmailAuthValidator,
    passwordAuthValidator,
    errorsResultMiddleware,
    authController.loginUser);
router.get('/me',
    bearerAuthorizationMiddleware,
    authController.getCurrentUserInfo);
router.post('/registration',
    rateLimitingMiddleware,
    loginFieldValidator,
    passwordFieldValidator,
    emailFieldValidator,
    errorsResultMiddleware,
    authController.registerUser);
router.post('/registration-confirmation',
    rateLimitingMiddleware,
    confirmationCodeValidator,
    errorsResultMiddleware,
    authController.confirmRegistration);
router.post('/registration-email-resending',
    rateLimitingMiddleware,
    emailFieldValidator,
    errorsResultMiddleware,
    authController.resendRegistrationEmail);
router.post('/refresh-token',
    refreshTokenVerification,
    authController.refreshToken);
router.post('/logout',
    refreshTokenVerification,
    authController.logoutUser);

export { router as authRouter };