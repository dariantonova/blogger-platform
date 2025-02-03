import {DeviceAuthSessionDbType, DeviceViewModel} from "./types/auth.types";
import {deviceAuthSessionsCollection} from "../../db/db";

export const deviceAuthSessionsQueryRepository = {
    async findUserSessions(userId: string): Promise<DeviceViewModel[]> {
        const deviceAuthSessions = await deviceAuthSessionsCollection
            .find({ userId }, { projection: { _id: 0 } })
            .toArray() as DeviceAuthSessionDbType[];

        return Promise.all(deviceAuthSessions.map(this.mapToOutput));
    },
    async mapToOutput(dbDeviceAuthSession: DeviceAuthSessionDbType): Promise<DeviceViewModel> {
        return {
            ip: dbDeviceAuthSession.ip,
            title: dbDeviceAuthSession.deviceName,
            lastActiveDate: dbDeviceAuthSession.iat.toISOString(),
            deviceId: dbDeviceAuthSession.deviceId,
        }
    },
};