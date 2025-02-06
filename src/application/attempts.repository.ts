import {attemptsCollection} from "../db/db";
import {AttemptDbType} from "../types/types";

export const attemptsRepository = {
    async deleteAllAttempts() {
        await attemptsCollection.drop();
    },
    async countAttemptsFromDate(ip: string, url: string, fromDate: Date) {
        const filterObj = { ip, url, date: { $gte: fromDate } };
        return attemptsCollection.countDocuments(filterObj);
    },
    async createAttempt(ip: string, url: string, date: Date) {
        const attempt: AttemptDbType = {
            ip,
            url,
            date,
        };
        await attemptsCollection.insertOne(attempt);
    },
};