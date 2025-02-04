import {Request, Response} from 'express';
import {DeviceViewModel} from "../auth/types/auth.types";
import {deviceAuthSessionsQueryRepository} from "../auth/device-auth-sessions.query.repository";
import {RequestWithParams, UserDBType} from "../../types/types";
import {securityDevicesService} from "./security-devices.service";
import {ResultStatus} from "../../common/result/resultStatus";
import {resultStatusToHttp} from "../../common/result/resultStatusToHttp";
import {HTTP_STATUSES} from "../../utils";

export const securityDevicesController = {
    getDeviceSessions: async (req: Request, res: Response<DeviceViewModel[]>) => {
        const user = req.user as UserDBType;
        const deviceSessions = await deviceAuthSessionsQueryRepository.findUserSessions(user.id);

        res.json(deviceSessions);
    },
    terminateAllOtherDeviceSessions: async (req: Request, res: Response) => {
        const refreshToken = req.cookies.refreshToken;

        const result = await securityDevicesService.terminateAllOtherDeviceSessions(refreshToken);
        if (result.status !== ResultStatus.SUCCESS) {
            res.sendStatus(resultStatusToHttp(result.status));
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    },
    terminateDeviceSession: async (req: RequestWithParams<{ deviceId: string }>, res: Response) => {
        const deviceIdToTerminate = req.params.deviceId;
        const user = req.user as UserDBType;

        const result = await securityDevicesService.terminateDeviceSession(deviceIdToTerminate, user.id);
        if (result.status !== ResultStatus.SUCCESS) {
            res.sendStatus(resultStatusToHttp(result.status));
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    },
};