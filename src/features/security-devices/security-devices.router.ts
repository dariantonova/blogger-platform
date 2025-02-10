import {Router} from "express";
import {refreshTokenVerification} from "../auth/middlewares/refresh-token-verification";
import {securityDevicesController} from "./security-devices.controller";

const router = Router();

router.get('/',
    refreshTokenVerification,
    securityDevicesController.getDeviceSessions.bind(securityDevicesController));
router.delete('/',
    refreshTokenVerification,
    securityDevicesController.terminateAllOtherDeviceSessions.bind(securityDevicesController));
router.delete('/:deviceId',
    refreshTokenVerification,
    securityDevicesController.terminateDeviceSession.bind(securityDevicesController));

export { router as securityDevicesRouter };