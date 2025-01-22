import {ConfirmationInfoType, FieldError, UserDBType} from "../../types/types";
import {usersRepository} from "./repositories/users.repository";
import {cryptoService} from "../../services/crypto.service";
import {randomUUID} from "node:crypto";
import {add} from "date-fns";

export const usersService = {
    async createUser(login: string, password: string, email: string, isConfirmed: boolean): Promise<string | FieldError> {
        const userWithLogin = await usersRepository.findUserByLogin(login);
        if (userWithLogin) {
            return {
                field: 'login',
                message: 'Login must be unique',
            };
        }

        const userWithEmail = await usersRepository.findUserByEmail(email);
        if (userWithEmail) {
            return {
                field: 'email',
                message: 'Email must be unique',
            };
        }

        const passwordHash = await cryptoService.generateHash(password);

        const confirmationInfo: ConfirmationInfoType = {
            confirmationCode: null,
            expirationDate: null,
            isConfirmed: true,
        };
        if (!isConfirmed) {
            confirmationInfo.confirmationCode = randomUUID();
            confirmationInfo.expirationDate = add(new Date(), {
                hours: 1,
                minutes: 30,
            });
            confirmationInfo.isConfirmed = false
        }

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

        return createdUser.id;
    },
    async deleteUser(id: string): Promise<boolean> {
        return usersRepository.deleteUser(id);
    },
    async deleteAllUsers() {
        await usersRepository.deleteAllUsers();
    },
    async findUserById(id: string) {
        return usersRepository.findUserById(id);
    },
};