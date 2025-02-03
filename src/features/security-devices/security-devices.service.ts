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
};