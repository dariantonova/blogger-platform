import {refreshSessionsCollection} from "../../db/db";

export const refreshSessionsQueryRepository = {
    async getRefreshSessionByRefToken(refreshToken: string) {
        return refreshSessionsCollection.findOne({ refreshToken }, { projection: { _id: 0 } });
    },
};