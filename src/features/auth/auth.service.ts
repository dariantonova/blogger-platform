import {usersRepository} from "../users/repositories/users.repository";
import {cryptoService} from "../../application/crypto.service";
import {jwtService} from "../../application/jwt.service";
import {FieldError, UserDBType} from "../../types/types";
import {Result} from "../../common/result/result.type";
import {usersService} from "../users/users.service";
import {ResultStatus} from "../../common/result/resultStatus";
import {emailManager} from "../../application/email.manager";
import {RefreshSessionDTO} from "./types/auth.types";
import {refreshSessionsRepository} from "./refresh-sessions.repository";

export const authService = {
    async loginUser(loginOrEmail: string, password: string): Promise<{ accessToken: string, refreshToken: string } | null> {
        const user = await this._checkCredentials(loginOrEmail, password);
        if (!user) {
            return null;
        }

        return this._createTokenPair(user);
    },
    async _createTokenPair(user: UserDBType): Promise<{ accessToken: string, refreshToken: string }> {
        const accessToken = await jwtService.createAccessToken(user);
        const refreshToken = await jwtService.createRefreshToken(user);

        const doesRefTokenExist = await refreshSessionsRepository.doesRefreshTokenExist(refreshToken);
        if (!doesRefTokenExist) {
            await this._createRefreshSession(user.id, refreshToken);
        }

        return { accessToken, refreshToken };
    },
    async _checkCredentials(loginOrEmail: string, password: string): Promise<UserDBType | null> {
        const user = await usersRepository.findUserByLoginOrEmail(loginOrEmail);
        if (!user) {
            return null;
        }

        const isPasswordCorrect = await cryptoService.compareHash(password, user.passwordHash);
        return isPasswordCorrect ? user : null;
    },
    async _createRefreshSession(userId: string, refreshToken: string) {
        const refTokenExpDate = await jwtService.getRefreshTokenExpDate(refreshToken);
        const refreshSession: RefreshSessionDTO = {
            userId,
            refreshToken,
            expirationDate: refTokenExpDate,
        };

        await refreshSessionsRepository.createRefreshSession(refreshSession);
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
    async resendRegistrationEmail(email: string): Promise<Result<null>> {
        const user = await usersRepository.findUserByEmail(email);
        if (!user) {
            const error: FieldError = {
                field: 'email',
                message: 'No user with such email',
            };
            return {
                status: ResultStatus.BAD_REQUEST,
                data: null,
                extensions: [error],
            };
        }

        if (user.confirmationInfo.isConfirmed) {
            const error: FieldError = {
                field: 'email',
                message: 'Email is already confirmed',
            };
            return {
                status: ResultStatus.BAD_REQUEST,
                data: null,
                extensions: [error],
            };
        }

        const newConfirmationInfo = usersService.generateConfirmationInfo(false);
        const isConfirmationInfoUpdated = await usersRepository.updateUserConfirmationInfo(
            user.id, newConfirmationInfo
        );
        if (!isConfirmationInfoUpdated) {
            return {
                status: ResultStatus.INTERNAL_SERVER_ERROR,
                data: null,
                extensions: [],
            };
        }

        try {
            await emailManager.sendRegistrationMessage(email, newConfirmationInfo.confirmationCode);
        }
        catch (err) {
            console.log('Email send error: ' + err);
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
    async deleteAllRefreshSessions() {
        return refreshSessionsRepository.deleteAllRefreshSessions();
    },
    async verifyAccessToken(accessToken: string): Promise<Result<UserDBType | null>> {
        const userId = await jwtService.verifyAccessToken(accessToken);
        if (!userId) {
            return {
                status: ResultStatus.UNAUTHORIZED,
                data: null,
                extensions: [],
            };
        }

        const user = await usersService.findUserById(userId);
        if (!user) {
            return {
                status: ResultStatus.UNAUTHORIZED,
                data: null,
                extensions: [],
            };
        }

        return {
            status: ResultStatus.SUCCESS,
            data: user,
            extensions: [],
        };
    },
    async verifyRefreshToken(refreshToken: string): Promise<Result<UserDBType | null>> {
        const userId = await jwtService.verifyRefreshToken(refreshToken);
        if (!userId) {
            return {
                status: ResultStatus.UNAUTHORIZED,
                data: null,
                extensions: [],
            };
        }

        const user = await usersService.findUserById(userId);
        if (!user) {
            return {
                status: ResultStatus.UNAUTHORIZED,
                data: null,
                extensions: [],
            };
        }

        const isRefTokenInWhitelist = await refreshSessionsRepository.doesRefreshTokenExist(refreshToken);
        if (!isRefTokenInWhitelist) {
            return {
                status: ResultStatus.UNAUTHORIZED,
                data: null,
                extensions: [],
            };
        }

        return {
            status: ResultStatus.SUCCESS,
            data: user,
            extensions: [],
        };
    },
    async refreshToken(tokenToRevoke: string, user: UserDBType): Promise<Result<{ accessToken: string, refreshToken: string } | null>> {
        const isRefTokenRevoked = await refreshSessionsRepository.revokeRefreshToken(tokenToRevoke);
        if (!isRefTokenRevoked) {
            return {
                status: ResultStatus.INTERNAL_SERVER_ERROR,
                data: null,
                extensions: [],
            };
        }

        const tokenPair = await this._createTokenPair(user);
        return {
            status: ResultStatus.SUCCESS,
            data: tokenPair,
            extensions: [],
        };
    },
    async logoutUser(tokenToRevoke: string): Promise<Result<null>> {
        const isRefTokenRevoked = await refreshSessionsRepository.revokeRefreshToken(tokenToRevoke);
        if (!isRefTokenRevoked) {
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