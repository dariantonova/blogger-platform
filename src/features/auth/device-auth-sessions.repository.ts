import { injectable } from "inversify";
import {DeviceAuthSessionModel} from "../../db/db";
import {DeviceAuthSessionDBType} from "./types/auth.types";

@injectable()
export class DeviceAuthSessionsRepository {
    async deleteAllDeviceAuthSessions() {
        await DeviceAuthSessionModel.deleteMany({});
    };
    async createDeviceAuthSession(deviceAuthSession: DeviceAuthSessionDBType): Promise<string> {
        const insertInfo = await DeviceAuthSessionModel.create(deviceAuthSession);
        return insertInfo._id.toString();
    };
    async updateDeviceAuthSession(deviceId: string, iat: Date, exp: Date, ip: string): Promise<boolean> {
        const updateInfo = await DeviceAuthSessionModel.updateOne(
            { deviceId },
            { iat, exp, ip }
        );
        return updateInfo.matchedCount === 1;
    };
    async isActiveSession(deviceId: string, iat: Date): Promise<boolean> {
        const deviceAuthSession = await DeviceAuthSessionModel
            .findOne({ deviceId, iat });
        return !!deviceAuthSession;
    };
    async terminateSession(deviceId: string): Promise<boolean> {
        const filterObj = { deviceId };
        const deleteInfo = await DeviceAuthSessionModel.deleteOne(filterObj);
        return deleteInfo.deletedCount === 1;
    };
    async deleteUserSessions(userId: string) {
        const filterObj = { userId };
        await DeviceAuthSessionModel.deleteMany(filterObj);
    };
    async terminateAllOtherUserSessions(userId: string, currentDeviceId: string) {
        const filterObj = { userId, deviceId: { $ne: currentDeviceId } };
        await DeviceAuthSessionModel.deleteMany(filterObj);
    };
    async findSessionByDeviceId(deviceId: string): Promise<DeviceAuthSessionDBType | null> {
        return DeviceAuthSessionModel.findOne({ deviceId }, { _id: 0 }).lean();
    };
}