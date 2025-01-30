import {refreshSessionsCollection} from "../../src/db/db";

export const refreshSessionsTestRepository = {
    async findUserRefreshSessions(userId: string) {
        return refreshSessionsCollection
            .find({ userId }, { projection: { _id: 0 } })
            .sort({ _id: 1 })
            .toArray();
    },
};