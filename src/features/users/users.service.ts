import {ConfirmationInfoType, FieldError, PasswordRecoveryInfo, UserDBType} from "../../types/types";
import {UsersRepository} from "./repositories/users.repository";
import {CryptoService} from "../../application/crypto.service";
import {randomUUID} from "node:crypto";
import {add} from "date-fns";
import {Result} from "../../common/result/result.type";
import {ResultStatus} from "../../common/result/resultStatus";
import {DeviceAuthSessionsRepository} from "../auth/device-auth-sessions.repository";
import {inject, injectable} from "inversify";

export const confirmationCodeLifetime = {
    hours: 1,
    minutes: 30,
};

export const passwordRecoveryCodeLifetime = {
    hours: 1,
};

@injectable()
export class UsersService {
    constructor(
        @inject(UsersRepository) protected usersRepository: UsersRepository,
        @inject(DeviceAuthSessionsRepository) protected deviceAuthSessionsRepository: DeviceAuthSessionsRepository,
        @inject(CryptoService) protected cryptoService: CryptoService
    ) {}

    async createUser(login: string, email: string, password: string, isConfirmed: boolean): Promise<Result<string | null>> {
        const userWithLogin = await this.usersRepository.findUserByLogin(login);
        if (userWithLogin) {
            const error = new FieldError(
                'login',
                'Login must be unique'
            );
            return {
                status: ResultStatus.BAD_REQUEST,
                data: null,
                extensions: [error],
            };
        }

        const userWithEmail = await this.usersRepository.findUserByEmail(email);
        if (userWithEmail) {
            const error = new FieldError(
                'email',
                'Email must be unique'
            );
            return {
                status: ResultStatus.BAD_REQUEST,
                data: null,
                extensions: [error],
            };
        }

        const passwordHash = await this.cryptoService.generateHash(password);

        const confirmationInfo = this.generateConfirmationInfo(isConfirmed);
        const passwordRecoveryInfo = this.generateEmptyPasswordRecoveryInfo();

        const createdUser = new UserDBType(
            String(+new Date()),
            login,
            email,
            new Date(),
            passwordHash,
            confirmationInfo,
            passwordRecoveryInfo,
            false
        );

        await this.usersRepository.createUser(createdUser);

        return {
            status: ResultStatus.SUCCESS,
            data: createdUser.id,
            extensions: [],
        };
    };
    generateConfirmationInfo(isConfirmed: boolean): ConfirmationInfoType {
        if (isConfirmed) {
            return new ConfirmationInfoType(
                '',
                new Date(),
                true
            );
        }
        return new ConfirmationInfoType(
            randomUUID(),
            add(new Date(), confirmationCodeLifetime),
            false
        );
    };
    generateEmptyPasswordRecoveryInfo(): PasswordRecoveryInfo {
        return new PasswordRecoveryInfo('', new Date());
    };
    async deleteUser(id: string): Promise<boolean> {
        const isUserDeleted = await this.usersRepository.deleteUser(id);

        if (isUserDeleted) {
            await this.deviceAuthSessionsRepository.deleteUserSessions(id);
        }

        return isUserDeleted;
    };
    async deleteAllUsers() {
        await this.usersRepository.deleteAllUsers();
    };
    async findUserById(id: string): Promise<UserDBType | null> {
        return this.usersRepository.findUserById(id);
    };
}