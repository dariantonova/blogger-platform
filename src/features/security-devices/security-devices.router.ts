import {Router} from "express";
import {refreshTokenVerification} from "../auth/middlewares/refresh-token-verification";
import {container} from "../../composition-root";
import {SecurityDevicesController} from "./security-devices.controller";

const securityDevicesController = container
    .get<SecurityDevicesController>(SecurityDevicesController);

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