import {Router} from "express";
import {
    confirmationCodeValidator,
    loginOrEmailAuthValidator, newPasswordValidator,
    passwordAuthValidator, passwordRecoveryCodeValidator
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
import {container} from "../../composition-root";
import {AuthController} from "./auth.controller";

const authController = container.get<AuthController>(AuthController);

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
router.post('/password-recovery',
    rateLimitingMiddleware,
    emailFieldValidator,
    errorsResultMiddleware,
    authController.requestPasswordRecovery.bind(authController));
router.post('/new-password',
    rateLimitingMiddleware,
    newPasswordValidator,
    passwordRecoveryCodeValidator,
    errorsResultMiddleware,
    authController.confirmPasswordRecovery.bind(authController))

export { router as authRouter };