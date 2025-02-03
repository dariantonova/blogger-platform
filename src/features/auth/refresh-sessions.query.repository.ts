import {refreshSessionsCollection} from "../../db/db";

export const refreshSessionsQueryRepository = {
    async findSessionByDeviceIdAndIat(deviceId: string, iat: Date) {
        return refreshSessionsCollection.findOne({ deviceId, iat }, { projection: { _id: 0 } });
    },
};