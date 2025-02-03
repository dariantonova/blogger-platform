import {ConfirmationInfoType, FieldError, UserDBType} from "../../types/types";
import {usersRepository} from "./repositories/users.repository";
import {cryptoService} from "../../application/crypto.service";
import {randomUUID} from "node:crypto";
import {add} from "date-fns";
import {Result} from "../../common/result/result.type";
import {ResultStatus} from "../../common/result/resultStatus";
import {deviceAuthSessionsRepository} from "../auth/device-auth-sessions.repository";

export const confirmationCodeLifetime = {
    hours: 1,
    minutes: 30,
};

export const usersService = {
    async createUser(login: string, email: string, password: string, isConfirmed: boolean): Promise<Result<string | null>> {
        const userWithLogin = await usersRepository.findUserByLogin(login);
        if (userWithLogin) {
            const error: FieldError = {
                field: 'login',
                message: 'Login must be unique',
            };
            return {
                status: ResultStatus.BAD_REQUEST,
                data: null,
                extensions: [error],
            };
        }

        const userWithEmail = await usersRepository.findUserByEmail(email);
        if (userWithEmail) {
            const error: FieldError = {
                field: 'email',
                message: 'Email must be unique',
            };
            return {
                status: ResultStatus.BAD_REQUEST,
                data: null,
                extensions: [error],
            };
        }

        const passwordHash = await cryptoService.generateHash(password);

        const confirmationInfo = this.generateConfirmationInfo(isConfirmed);

        const createdUser: UserDBType = {
            id: String(+new Date()),
            login,
            email,
            createdAt: new Date(),
            passwordHash,
            confirmationInfo,
            isDeleted: false,
        }

        await usersRepository.createUser(createdUser);

        return {
            status: ResultStatus.SUCCESS,
            data: createdUser.id,
            extensions: [],
        };
    },
    generateConfirmationInfo(isConfirmed: boolean): ConfirmationInfoType {
        if (isConfirmed) {
            return {
                confirmationCode: '',
                expirationDate: new Date(),
                isConfirmed: true,
            };
        }
        return {
            confirmationCode: randomUUID(),
            expirationDate: add(new Date(), confirmationCodeLifetime),
            isConfirmed: false,
        };
    },
    async deleteUser(id: string): Promise<boolean> {
        const isUserDeleted = await usersRepository.deleteUser(id);

        if (isUserDeleted) {
            await deviceAuthSessionsRepository.deleteUserSessions(id);
        }

        return isUserDeleted;
    },
    async deleteAllUsers() {
        await usersRepository.deleteAllUsers();
    },
    async findUserById(id: string) {
        return usersRepository.findUserById(id);
    },
};