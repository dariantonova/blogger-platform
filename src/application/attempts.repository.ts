import {AttemptModel} from "../db/db";
import {AttemptDBType} from "../types/types";

class AttemptsRepository {
    async deleteAllAttempts() {
        await AttemptModel.deleteMany({});
    };
    async countAttemptsFromDate(ip: string, url: string, fromDate: Date) {
        const filterObj = { ip, url, date: { $gte: fromDate } };
        return AttemptModel.countDocuments(filterObj);
    };
    async createAttempt(ip: string, url: string, date: Date) {
        const attempt = new AttemptDBType(ip, url, date);
        await AttemptModel.create(attempt);
    };
}

export const attemptsRepository = new AttemptsRepository();