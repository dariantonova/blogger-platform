import {refreshSessionsCollection} from "../../db/db";
import {RefreshSessionDbType, RefreshSessionDTO} from "./types/auth.types";

export const refreshSessionsRepository = {
    async deleteAllRefreshSessions() {
        await refreshSessionsCollection.drop();
    },
    async createRefreshSession({ userId, refreshToken, expirationDate }: RefreshSessionDTO): Promise<string> {
        const refreshSession: RefreshSessionDbType = {
            userId,
            refreshToken,
            expirationDate,
        };
        const insertInfo = await refreshSessionsCollection.insertOne(refreshSession);
        return insertInfo.insertedId.toString();
    },
    async doesRefreshTokenExist(refreshToken: string): Promise<boolean> {
        const refreshSession = await refreshSessionsCollection
            .findOne({ refreshToken });
        return !!refreshSession;
    },
    async revokeRefreshToken(refreshToken: string): Promise<boolean> {
        const filterObj = { refreshToken };
        const deleteInfo = await refreshSessionsCollection.deleteOne(filterObj);
        return deleteInfo.deletedCount === 1;
    },
    async deleteUserSessions(userId: string) {
        const filterObj = { userId };
        await refreshSessionsCollection.deleteMany(filterObj);
    },
};