import {attemptsRepository} from "./attempts.repository";

class AttemptsService {
    async deleteAllAttempts() {
        return attemptsRepository.deleteAllAttempts();
    };
    async countAttemptsFromDate(ip: string, url: string, fromDate: Date) {
        return attemptsRepository.countAttemptsFromDate(ip, url, fromDate);
    };
    async createAttempt(ip: string, url: string) {
        return attemptsRepository.createAttempt(ip, url, new Date());
    };
}

export const attemptsService = new AttemptsService();