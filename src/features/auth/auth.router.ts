import {Router} from "express";
import {
    confirmationCodeValidator,
    loginOrEmailAuthValidator,
    passwordAuthValidator
} from "../../validation/field-validators/auth-field-validators";
import {errorsResultMiddleware} from "../../validation/errors-result-middleware";
import {bearerAuthorizationMiddleware} from "../../middlewares/bearer-authorization-middleware";
import {
    emailFieldValidator,
    loginFieldValidator,
    passwordFieldValidator
} from "../../validation/field-validators/users-field-validators";
import {refreshTokenVerification} from "./middlewares/refresh-token-verification";
import {rateLimitingMiddleware} from "../../middlewares/rate-limiting-middleware";
import {noActiveDeviceSessionExists} from "./middlewares/no-active-device-session-exists";
import {authController} from "../../composition-root";

const router = Router();

router.post('/login',
    rateLimitingMiddleware,
    noActiveDeviceSessionExists,
    loginOrEmailAuthValidator,
    passwordAuthValidator,
    errorsResultMiddleware,
    authController.loginUser.bind(authController));
router.get('/me',
    bearerAuthorizationMiddleware,
    authController.getCurrentUserInfo.bind(authController));
router.post('/registration',
    rateLimitingMiddleware,
    loginFieldValidator,
    passwordFieldValidator,
    emailFieldValidator,
    errorsResultMiddleware,
    authController.registerUser.bind(authController));
router.post('/registration-confirmation',
    rateLimitingMiddleware,
    confirmationCodeValidator,
    errorsResultMiddleware,
    authController.confirmRegistration.bind(authController));
router.post('/registration-email-resending',
    rateLimitingMiddleware,
    emailFieldValidator,
    errorsResultMiddleware,
    authController.resendRegistrationEmail.bind(authController));
router.post('/refresh-token',
    refreshTokenVerification,
    authController.refreshToken.bind(authController));
router.post('/logout',
    refreshTokenVerification,
    authController.logoutUser.bind(authController));

export { router as authRouter };