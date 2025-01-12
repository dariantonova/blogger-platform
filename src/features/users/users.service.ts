import {FieldError, UserDBType} from "../../types";
import {usersRepository} from "./repositories/users.repository";
import bcrypt from 'bcrypt';

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

        const passwordHash = await this.generateHash(password);
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
    async generateHash(password: string): Promise<string> {
        const saltRounds = 10;
        return bcrypt.hash(password, saltRounds);
    },
    async checkCredentials(loginOrEmail: string, password: string): Promise<boolean> {
        const user = await usersRepository.findUserByLoginOrEmail(loginOrEmail);
        if (!user) {
            return false;
        }

        return bcrypt.compare(password, user.passwordHash);
    },
    async deleteUser(id: string): Promise<boolean> {
        return usersRepository.deleteUser(id);
    },
    async deleteAllUsers() {
        await usersRepository.deleteAllUsers();
    },
};