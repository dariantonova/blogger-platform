import {usersRepository} from "../users/repositories/users.repository";
import {cryptoService} from "../../application/crypto.service";
import {jwtService} from "../../application/jwt.service";
import {FieldError, UserDBType} from "../../types/types";
import {Result} from "../../common/result/result.type";
import {usersService} from "../users/users.service";
import {ResultStatus} from "../../common/result/resultStatus";
import {emailManager} from "../../application/email.manager";
import {DeviceAuthSessionDTO, TokenPair} from "./types/auth.types";
import {deviceAuthSessionsRepository} from "./device-auth-sessions.repository";
import {randomUUID} from "node:crypto";

export const authService = {
    async loginUser(loginOrEmail: string, password: string, deviceName: string, ip: string)
        : Promise<Result<TokenPair | null>> {
        const user = await this._checkCredentials(loginOrEmail, password);
        if (!user) {
            return {
                status: ResultStatus.UNAUTHORIZED,
                data: null,
                extensions: [],
            };
        }

        const deviceId = randomUUID();
        const tokenPair = await this._createTokenPair(user, deviceId);
        await this._createDeviceAuthSession(tokenPair.refreshToken, deviceName, ip);

        return {
            status: ResultStatus.SUCCESS,
            data: tokenPair,
            extensions: [],
        };
    },
    async _createTokenPair(user: UserDBType, deviceId: string): Promise<TokenPair> {
        const accessToken = await jwtService.createAccessToken(user);
        const refreshToken = await jwtService.createRefreshToken(user, deviceId);
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
    async _createDeviceAuthSession(refreshToken: string, deviceName: string, ip: string) {
        const refTokenPayload = await jwtService.decodeRefreshToken(refreshToken);
        const userId = refTokenPayload.userId;
        const iat = new Date(refTokenPayload.iat * 1000);
        const exp = new Date(refTokenPayload.exp * 1000);
        const deviceId = refTokenPayload.deviceId;
        const deviceAuthSession: DeviceAuthSessionDTO = {
            userId,
            deviceId,
            iat,
            deviceName,
            ip,
            exp,
        };

        await deviceAuthSessionsRepository.createDeviceAuthSession(deviceAuthSession);
    },
    async _updateDeviceAuthSession(newRefreshToken: string, newIp: string): Promise<boolean> {
        const newRefTokenPayload = await jwtService
            .decodeRefreshToken(newRefreshToken);

        return deviceAuthSessionsRepository.updateDeviceAuthSession(
            newRefTokenPayload.deviceId,
            new Date(newRefTokenPayload.iat * 1000),
            new Date(newRefTokenPayload.exp * 1000),
            newIp
        );
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
    async deleteAllDeviceAuthSessions() {
        return deviceAuthSessionsRepository.deleteAllDeviceAuthSessions();
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
        const decoded = await jwtService.verifyRefreshToken(refreshToken);
        if (!decoded) {
            return {
                status: ResultStatus.UNAUTHORIZED,
                data: null,
                extensions: [],
            };
        }

        const userId = decoded.userId;
        const deviceId = decoded.deviceId;
        const iat = new Date(decoded.iat * 1000);

        const user = await usersService.findUserById(userId);
        if (!user) {
            return {
                status: ResultStatus.UNAUTHORIZED,
                data: null,
                extensions: [],
            };
        }

        const isRefTokenInWhitelist = await deviceAuthSessionsRepository.isActiveSession(deviceId, iat);
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
    async refreshToken(tokenToRevoke: string, user: UserDBType, ip: string): Promise<Result<TokenPair | null>> {
        const tokenToRevokePayload = await jwtService.decodeRefreshToken(tokenToRevoke);
        const deviceId = tokenToRevokePayload.deviceId;
        const newTokenPair = await this._createTokenPair(user, deviceId);

        const isSessionUpdated = await this._updateDeviceAuthSession(newTokenPair.refreshToken, ip);
        if (!isSessionUpdated) {
            return {
                status: ResultStatus.INTERNAL_SERVER_ERROR,
                data: null,
                extensions: [],
            };
        }

        return {
            status: ResultStatus.SUCCESS,
            data: newTokenPair,
            extensions: [],
        };
    },
    async logoutUser(tokenToRevoke: string): Promise<Result<null>> {
        const tokenPayload = await jwtService.decodeRefreshToken(tokenToRevoke);
        const isSessionTerminated = await deviceAuthSessionsRepository.terminateSession(tokenPayload.deviceId);
        if (!isSessionTerminated) {
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