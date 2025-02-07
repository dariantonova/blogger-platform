import {DeviceAuthSessionDBType, DeviceViewModel} from "./types/auth.types";
import {DeviceAuthSessionModel} from "../../db/db";

export const deviceAuthSessionsQueryRepository = {
    async findUserSessions(userId: string): Promise<DeviceViewModel[]> {
        const deviceAuthSessions = await DeviceAuthSessionModel
            .find({ userId }, { _id: 0 })
            .lean();
            // .toArray() as DeviceAuthSessionDBType[];

        return Promise.all(deviceAuthSessions.map(this.mapToOutput));
    },
    async mapToOutput(dbDeviceAuthSession: DeviceAuthSessionDBType): Promise<DeviceViewModel> {
        return {
            ip: dbDeviceAuthSession.ip,
            title: dbDeviceAuthSession.deviceName,
            lastActiveDate: dbDeviceAuthSession.iat.toISOString(),
            deviceId: dbDeviceAuthSession.deviceId,
        }
    },
};