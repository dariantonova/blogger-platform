import {attemptsRepository} from "./attempts.repository";

export const attemptsService = {
    async deleteAllAttempts() {
        return attemptsRepository.deleteAllAttempts();
    },
    async countRecentAttempts(ip: string, url: string, intervalMs: number) {
        return attemptsRepository.countRecentAttempts(ip, url, intervalMs);
    },
    async createAttempt(ip: string, url: string) {
        return attemptsRepository.createAttempt(ip, url, new Date());
    },
};