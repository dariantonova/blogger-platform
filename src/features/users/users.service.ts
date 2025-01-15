import {FieldError, UserDBType} from "../../types/types";
import {usersRepository} from "./repositories/users.repository";
import {cryptoService} from "../../services/crypto.service";

export const usersService = {
    async createUser(login: string, password: string, email: string): Promise<string | FieldError> {
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
        const createdUser: UserDBType = {
            id: String(+new Date()),
            login,
            email,
            createdAt: new Date().toISOString(),
            passwordHash,
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