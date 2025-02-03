import {Router} from "express";
import {refreshTokenVerification} from "../auth/middlewares/refresh-token-verification";
import {securityDevicesController} from "./security-devices.controller";

const router = Router();

router.get('/',
    refreshTokenVerification,
    securityDevicesController.getDeviceSessions);
router.delete('/',
    refreshTokenVerification,
    securityDevicesController.terminateAllOtherDeviceSessions);

export { router as securityDevicesRouter };