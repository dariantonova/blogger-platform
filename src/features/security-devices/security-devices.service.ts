import {Result} from "../../common/result/result.type";
import {JwtService} from "../../application/jwt.service";
import {DeviceAuthSessionsRepository} from "../auth/device-auth-sessions.repository";
import {ResultStatus} from "../../common/result/resultStatus";
import {inject, injectable} from "inversify";

@injectable()
export class SecurityDevicesService {
    constructor(
        @inject(DeviceAuthSessionsRepository) protected deviceAuthSessionsRepository: DeviceAuthSessionsRepository,
        @inject(JwtService) protected jwtService: JwtService
    ) {}

    async terminateAllOtherDeviceSessions(refreshToken: string): Promise<Result<null>> {
        const refTokenPayload = await this.jwtService.decodeRefreshToken(refreshToken);
        await this.deviceAuthSessionsRepository.terminateAllOtherUserSessions(
            refTokenPayload.userId, refTokenPayload.deviceId
        );

        return {
            status: ResultStatus.SUCCESS,
            data: null,
            extensions: [],
        };
    };
    async terminateDeviceSession(deviceId: string, currentUserId: string): Promise<Result<null>> {
        const deviceAuthSession = await this.deviceAuthSessionsRepository
            .findSessionByDeviceId(deviceId);
        if (!deviceAuthSession) {
            return {
                status: ResultStatus.NOT_FOUND,
                data: null,
                extensions: [],
            };
        }

        if (deviceAuthSession.userId !== currentUserId) {
            return {
                status: ResultStatus.FORBIDDEN,
                data: null,
                extensions: [],
            };
        }

        const isSessionTerminated = await this.deviceAuthSessionsRepository.terminateSession(deviceId);
        if (!isSessionTerminated) {
            return {
                status: ResultStatus.INTERNAL_SERVER_ERROR,
                data: null,
                extensions: [],
            };
        }

        return {
            status: ResultStatus.SUCCESS,
            data: null,
            extensions: [],
        };
    };
}