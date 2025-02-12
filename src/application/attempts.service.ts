import {AttemptsRepository} from "./attempts.repository";
import {inject, injectable} from "inversify";

@injectable()
export class AttemptsService {
    constructor(
        @inject(AttemptsRepository) protected attemptsRepository: AttemptsRepository
    ) {}

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