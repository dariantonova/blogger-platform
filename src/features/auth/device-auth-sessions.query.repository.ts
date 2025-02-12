import {DeviceAuthSessionDBType, DeviceViewModel} from "./types/auth.types";
import {DeviceAuthSessionModel} from "../../db/db";
import {injectable} from "inversify";

@injectable()
export class DeviceAuthSessionsQueryRepository {
    async findUserSessions(userId: string): Promise<DeviceViewModel[]> {
        const deviceAuthSessions = await DeviceAuthSessionModel
            .find({ userId }, { _id: 0 })
            .lean();

        return Promise.all(deviceAuthSessions.map(this.mapToOutput));
    };
    async mapToOutput(dbDeviceAuthSession: DeviceAuthSessionDBType): Promise<DeviceViewModel> {
        return new DeviceViewModel(
            dbDeviceAuthSession.ip,
            dbDeviceAuthSession.deviceName,
            dbDeviceAuthSession.iat.toISOString(),
            dbDeviceAuthSession.deviceId
        );
    };
}