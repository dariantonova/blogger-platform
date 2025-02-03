import {Result} from "../../common/result/result.type";
import {jwtService} from "../../application/jwt.service";
import {deviceAuthSessionsRepository} from "../auth/device-auth-sessions.repository";
import {ResultStatus} from "../../common/result/resultStatus";

export const securityDevicesService = {
    async terminateAllOtherDeviceSessions(refreshToken: string): Promise<Result<null>> {
        const refTokenPayload = await jwtService.decodeRefreshToken(refreshToken);
        await deviceAuthSessionsRepository.terminateAllOtherUserSessions(
            refTokenPayload.userId, refTokenPayload.deviceId
        );

        return {
            status: ResultStatus.SUCCESS,
            data: null,
            extensions: [],
        };
    },
    async terminateDeviceSession(deviceId: string, currentUserId: string): Promise<Result<null>> {
        const deviceAuthSession = await deviceAuthSessionsRepository
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

        const isSessionTerminated = await deviceAuthSessionsRepository.terminateSession(deviceId);
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
    },
};