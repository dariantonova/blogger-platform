import {AttemptsRepository} from "./attempts.repository";

export class AttemptsService {
    private attemptsRepository: AttemptsRepository;
    constructor() {
        this.attemptsRepository = new AttemptsRepository();
    }

    async deleteAllAttempts() {
        return this.attemptsRepository.deleteAllAttempts();
    };
    async countAttemptsFromDate(ip: string, url: string, fromDate: Date) {
        return this.attemptsRepository.countAttemptsFromDate(ip, url, fromDate);
    };
    async createAttempt(ip: string, url: string) {
        return this.attemptsRepository.createAttempt(ip, url, new Date());
    };
}

export const attemptsService = new AttemptsService();