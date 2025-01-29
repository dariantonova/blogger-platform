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
};