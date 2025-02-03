import {refreshSessionsCollection} from "../../db/db";
import {RefreshSessionDbType, RefreshSessionDTO} from "./types/auth.types";

export const refreshSessionsRepository = {
    async deleteAllRefreshSessions() {
        await refreshSessionsCollection.drop();
    },
    async createRefreshSession({ userId, deviceId, iat, deviceName, ip, exp }: RefreshSessionDTO): Promise<string> {
        const refreshSession: RefreshSessionDbType = {
            userId,
            deviceId,
            iat,
            deviceName,
            ip,
            exp,
        };
        const insertInfo = await refreshSessionsCollection.insertOne(refreshSession);
        return insertInfo.insertedId.toString();
    },
    async updateRefreshSession(deviceId: string, iat: Date, exp: Date, ip: string): Promise<boolean> {
        const updateInfo = await refreshSessionsCollection.updateOne(
            { deviceId },
            { $set: { iat, exp, ip } }
        );
        return updateInfo.matchedCount === 1;
    },
    async doesSessionExist(deviceId: string, iat: Date): Promise<boolean> {
        const refreshSession = await refreshSessionsCollection
            .findOne({ deviceId, iat });
        return !!refreshSession;
    },
    async terminateSession(deviceId: string): Promise<boolean> {
        const filterObj = { deviceId };
        const deleteInfo = await refreshSessionsCollection.deleteOne(filterObj);
        return deleteInfo.deletedCount === 1;
    },
    async deleteUserSessions(userId: string) {
        const filterObj = { userId };
        await refreshSessionsCollection.deleteMany(filterObj);
    },
};