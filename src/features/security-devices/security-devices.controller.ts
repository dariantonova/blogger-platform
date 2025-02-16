import {Request, Response} from 'express';
import {DeviceViewModel} from "../auth/types/auth.types";
import {DeviceAuthSessionsQueryRepository} from "../auth/device-auth-sessions.query.repository";
import {RequestWithParams, UserDBType} from "../../types/types";
import {SecurityDevicesService} from "./security-devices.service";
import {ResultStatus} from "../../common/result/resultStatus";
import {resultStatusToHttp} from "../../common/result/resultStatusToHttp";
import {HTTP_STATUSES} from "../../utils";
import {inject, injectable} from "inversify";

@injectable()
export class SecurityDevicesController {
    constructor(
        @inject(SecurityDevicesService) protected securityDevicesService: SecurityDevicesService,
        @inject(DeviceAuthSessionsQueryRepository)
        protected deviceAuthSessionsQueryRepository: DeviceAuthSessionsQueryRepository
    ) {}

    async getDeviceSessions (req: Request, res: Response<DeviceViewModel[]>) {
        const user = req.user as UserDBType;
        const deviceSessions = await this.deviceAuthSessionsQueryRepository.findUserSessions(user.id);

        res.json(deviceSessions);
    };
    async terminateAllOtherDeviceSessions (req: Request, res: Response) {
        const refreshToken = req.cookies.refreshToken;

        const result = await this.securityDevicesService.terminateAllOtherDeviceSessions(refreshToken);
        if (result.status !== ResultStatus.SUCCESS) {
            res.sendStatus(resultStatusToHttp(result.status));
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    };
    async terminateDeviceSession (req: RequestWithParams<{ deviceId: string }>, res: Response) {
        const deviceIdToTerminate = req.params.deviceId;
        const user = req.user as UserDBType;

        const result = await this.securityDevicesService.terminateDeviceSession(deviceIdToTerminate, user.id);
        if (result.status !== ResultStatus.SUCCESS) {
            res.sendStatus(resultStatusToHttp(result.status));
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    };
}