import {deviceAuthSessionsCollection} from "../../db/db";
import {DeviceAuthSessionDbType, DeviceAuthSessionDTO} from "./types/auth.types";

export const deviceAuthSessionsRepository = {
    async deleteAllDeviceAuthSessions() {
        await deviceAuthSessionsCollection.drop();
    },
    async createDeviceAuthSession({ userId, deviceId, iat, deviceName, ip, exp }: DeviceAuthSessionDTO): Promise<string> {
        const deviceAuthSession: DeviceAuthSessionDbType = {
            userId,
            deviceId,
            iat,
            deviceName,
            ip,
            exp,
        };
        const insertInfo = await deviceAuthSessionsCollection.insertOne(deviceAuthSession);
        return insertInfo.insertedId.toString();
    },
    async updateDeviceAuthSession(deviceId: string, iat: Date, exp: Date, ip: string): Promise<boolean> {
        const updateInfo = await deviceAuthSessionsCollection.updateOne(
            { deviceId },
            { $set: { iat, exp, ip } }
        );
        return updateInfo.matchedCount === 1;
    },
    async doesSessionExist(deviceId: string, iat: Date): Promise<boolean> {
        const refreshSession = await deviceAuthSessionsCollection
            .findOne({ deviceId, iat });
        return !!refreshSession;
    },
    async terminateSession(deviceId: string): Promise<boolean> {
        const filterObj = { deviceId };
        const deleteInfo = await deviceAuthSessionsCollection.deleteOne(filterObj);
        return deleteInfo.deletedCount === 1;
    },
    async deleteUserSessions(userId: string) {
        const filterObj = { userId };
        await deviceAuthSessionsCollection.deleteMany(filterObj);
    },
    async terminateAllOtherUserSessions(userId: string, currentDeviceId: string) {
        const filterObj = { userId, deviceId: { $ne: currentDeviceId } };
        await deviceAuthSessionsCollection.deleteMany(filterObj);
    },
};