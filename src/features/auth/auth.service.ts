import {usersRepository} from "../users/repositories/users.repository";
import {cryptoService} from "../../application/crypto.service";
import {jwtService} from "../../application/jwt.service";
import {FieldError, UserDBType} from "../../types/types";
import {Result} from "../../common/result/result.type";
import {usersService} from "../users/users.service";
import {ResultStatus} from "../../common/result/resultStatus";
import {emailManager} from "../../application/email.manager";

export const authService = {
    async loginUser(loginOrEmail: string, password: string): Promise<{ accessToken: string } | null> {
        const user = await this.checkCredentials(loginOrEmail, password);
        if (!user) {
            return null;
        }
        const token = await jwtService.createJwt(user);
        return { accessToken: token };
    },
    async checkCredentials(loginOrEmail: string, password: string): Promise<UserDBType | null> {
        const user = await usersRepository.findUserByLoginOrEmail(loginOrEmail);
        if (!user) {
            return null;
        }

        const isPasswordCorrect = await cryptoService.compareHash(password, user.passwordHash);
        return isPasswordCorrect ? user : null;
    },
    async registerUser(login: string, email: string, password: string): Promise<Result<null>> {
        const createUserResult = await usersService.createUser(login, email, password, false);
        if (createUserResult.status !== ResultStatus.SUCCESS) {
            return createUserResult as Result<null>;
        }

        const createdUserId = createUserResult.data as string;
        const createdUser = await usersRepository.findUserById(createdUserId);
        if (!createdUser) {
            return {
                status: ResultStatus.INTERNAL_SERVER_ERROR,
                data: null,
                extensions: [],
            };
        }

        const confirmationCode = createdUser.confirmationInfo.confirmationCode;
        emailManager.sendRegistrationMessage(email, confirmationCode)
            .catch(err => console.log('Email send error: ' + err));

        return {
            status: ResultStatus.SUCCESS,
            data: null,
            extensions: [],
        };
    },
    async confirmRegistration(confirmationCode: string): Promise<Result<null>> {
        const user = await usersRepository.findUserByConfirmationCode(confirmationCode);
        if (!user) {
            const error: FieldError = {
                field: 'code',
                message: 'Confirmation code is incorrect',
            };
            return {
                status: ResultStatus.BAD_REQUEST,
                data: null,
                extensions: [error],
            };
        }

        if (user.confirmationInfo.isConfirmed) {
            const error: FieldError = {
                field: 'code',
                message: 'Confirmation code has already been applied',
            };
            return {
                status: ResultStatus.BAD_REQUEST,
                data: null,
                extensions: [error],
            };
        }

        if (new Date() > user.confirmationInfo.expirationDate) {
            const error: FieldError = {
                field: 'code',
                message: 'Confirmation code is expired',
            };
            return {
                status: ResultStatus.BAD_REQUEST,
                data: null,
                extensions: [error],
            };
        }

        const isRegistrationConfirmed = await usersRepository.confirmUserRegistration(user.id);
        if (!isRegistrationConfirmed) {
            return {
                status: ResultStatus.INTERNAL_SERVER_ERROR,
                data: null,
                extensions: [],
            };
        }

        return {
            status: ResultStatus.SUCCESS,
            data: null,
            extensions: [],
        };
    },
};