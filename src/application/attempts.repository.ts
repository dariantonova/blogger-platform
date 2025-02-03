import {attemptsCollection} from "../db/db";
import {AttemptDbType} from "../types/types";

export const attemptsRepository = {
    async deleteAllAttempts() {
        await attemptsCollection.drop();
    },
    async countRecentAttempts(ip: string, url: string, intervalMs: number) {
        const startDate = new Date(Date.now() - intervalMs);
        const filterObj = { ip, url, date: { $gte: startDate } };
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