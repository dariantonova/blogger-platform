import {UsersRepository} from "../users/repositories/users.repository";
import {CryptoService} from "../../application/crypto.service";
import {JwtService} from "../../application/jwt.service";
import {FieldError, PasswordRecoveryInfo, UserDBType} from "../../types/types";
import {Result} from "../../common/result/result.type";
import {UsersService} from "../users/users.service";
import {ResultStatus} from "../../common/result/resultStatus";
import {EmailManager} from "../../application/email.manager";
import {DeviceAuthSessionDBType, TokenPair} from "./types/auth.types";
import {randomUUID} from "node:crypto";
import {DeviceAuthSessionsRepository} from "./device-auth-sessions.repository";
import {inject, injectable} from "inversify";
import {add} from "date-fns";

export const passwordRecoveryCodeLifetime = {
    hours: 1,
};

@injectable()
export class AuthService {
    constructor(
        @inject(DeviceAuthSessionsRepository) protected deviceAuthSessionsRepository: DeviceAuthSessionsRepository,
        @inject(UsersService) protected usersService: UsersService,
        @inject(UsersRepository) protected usersRepository: UsersRepository,
        @inject(CryptoService) protected cryptoService: CryptoService,
        @inject(JwtService) protected jwtService: JwtService,
        @inject(EmailManager) protected emailManager: EmailManager
    ) {}

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
    };
    async _createTokenPair(user: UserDBType, deviceId: string): Promise<TokenPair> {
        const accessToken = await this.jwtService.createAccessToken(user);
        const refreshToken = await this.jwtService.createRefreshToken(user, deviceId);
        return { accessToken, refreshToken };
    };
    async _checkCredentials(loginOrEmail: string, password: string): Promise<UserDBType | null> {
        const user = await this.usersRepository.findUserByLoginOrEmail(loginOrEmail);
        if (!user) {
            return null;
        }

        const isPasswordCorrect = await this.cryptoService.compareHash(password, user.passwordHash);
        return isPasswordCorrect ? user : null;
    };
    async _createDeviceAuthSession(refreshToken: string, deviceName: string, ip: string) {
        const refTokenPayload = await this.jwtService.decodeRefreshToken(refreshToken);
        const userId = refTokenPayload.userId;
        const iat = new Date(refTokenPayload.iat * 1000);
        const exp = new Date(refTokenPayload.exp * 1000);
        const deviceId = refTokenPayload.deviceId;
        const deviceAuthSession = new DeviceAuthSessionDBType(
            userId,
            deviceId,
            iat,
            deviceName,
            ip,
            exp
        );

        await this.deviceAuthSessionsRepository.createDeviceAuthSession(deviceAuthSession);
    };
    async _updateDeviceAuthSession(newRefreshToken: string, newIp: string): Promise<boolean> {
        const newRefTokenPayload = await this.jwtService
            .decodeRefreshToken(newRefreshToken);

        return this.deviceAuthSessionsRepository.updateDeviceAuthSession(
            newRefTokenPayload.deviceId,
            new Date(newRefTokenPayload.iat * 1000),
            new Date(newRefTokenPayload.exp * 1000),
            newIp
        );
    };
    async registerUser(login: string, email: string, password: string): Promise<Result<null>> {
        const createUserResult = await this.usersService.createUser(login, email, password, false);
        if (createUserResult.status !== ResultStatus.SUCCESS) {
            return createUserResult as Result<null>;
        }

        const createdUserId = createUserResult.data as string;
        const createdUser = await this.usersRepository.findUserById(createdUserId);
        if (!createdUser) {
            return {
                status: ResultStatus.INTERNAL_SERVER_ERROR,
                data: null,
                extensions: [],
            };
        }

        this.emailManager.sendRegistrationMessage(email, createdUser.confirmationInfo.confirmationCode)
            .catch(err => console.log('Email send error: ' + err));

        return {
            status: ResultStatus.SUCCESS,
            data: null,
            extensions: [],
        };
    };
    async confirmRegistration(confirmationCode: string): Promise<Result<null>> {
        if (confirmationCode === '') {
            const error = new FieldError(
                'code',
                'Confirmation code is incorrect');
            return {
                status: ResultStatus.BAD_REQUEST,
                data: null,
                extensions: [error],
            };
        }

        const user = await this.usersRepository.findUserByConfirmationCode(confirmationCode);
        if (!user) {
            const error = new FieldError(
                'code',
                'Confirmation code is incorrect');
            return {
                status: ResultStatus.BAD_REQUEST,
                data: null,
                extensions: [error],
            };
        }

        if (user.confirmationInfo.isConfirmed) {
            const error = new FieldError(
                'code',
                'Confirmation code has already been applied'
            );
            return {
                status: ResultStatus.BAD_REQUEST,
                data: null,
                extensions: [error],
            };
        }

        if (new Date() > user.confirmationInfo.expirationDate) {
            const error = new FieldError(
                'code',
                'Confirmation code is expired'
            );
            return {
                status: ResultStatus.BAD_REQUEST,
                data: null,
                extensions: [error],
            };
        }

        const isRegistrationConfirmed = await this.usersRepository.confirmUserRegistration(user.id);
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
    };
    async resendRegistrationEmail(email: string): Promise<Result<null>> {
        const user = await this.usersRepository.findUserByEmail(email);
        if (!user) {
            const error = new FieldError(
                'email',
                'No user with such email'
            );
            return {
                status: ResultStatus.BAD_REQUEST,
                data: null,
                extensions: [error],
            };
        }

        if (user.confirmationInfo.isConfirmed) {
            const error = new FieldError(
                'email',
                'Email is already confirmed'
            );
            return {
                status: ResultStatus.BAD_REQUEST,
                data: null,
                extensions: [error],
            };
        }

        const newConfirmationInfo = this.usersService.generateConfirmationInfo(false);
        const isConfirmationInfoUpdated = await this.usersRepository.updateUserConfirmationInfo(
            user.id, newConfirmationInfo
        );
        if (!isConfirmationInfoUpdated) {
            return {
                status: ResultStatus.INTERNAL_SERVER_ERROR,
                data: null,
                extensions: [],
            };
        }

        this.emailManager.sendRegistrationMessage(email, newConfirmationInfo.confirmationCode)
            .catch(err => console.log('Email send error: ' + err));

        return {
            status: ResultStatus.SUCCESS,
            data: null,
            extensions: [],
        };
    };
    async deleteAllDeviceAuthSessions() {
        return this.deviceAuthSessionsRepository.deleteAllDeviceAuthSessions();
    };
    async verifyAccessToken(accessToken: string): Promise<Result<UserDBType | null>> {
        const userId = await this.jwtService.verifyAccessToken(accessToken);
        if (!userId) {
            return {
                status: ResultStatus.UNAUTHORIZED,
                data: null,
                extensions: [],
            };
        }

        const user = await this.usersService.findUserById(userId);
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
    };
    async verifyRefreshToken(refreshToken: string): Promise<Result<UserDBType | null>> {
        const decoded = await this.jwtService.verifyRefreshToken(refreshToken);
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

        const user = await this.usersService.findUserById(userId);
        if (!user) {
            return {
                status: ResultStatus.UNAUTHORIZED,
                data: null,
                extensions: [],
            };
        }

        const isRefTokenInWhitelist = await this.deviceAuthSessionsRepository.isActiveSession(deviceId, iat);
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
    };
    async refreshToken(tokenToRevoke: string, user: UserDBType, ip: string): Promise<Result<TokenPair | null>> {
        const tokenToRevokePayload = await this.jwtService.decodeRefreshToken(tokenToRevoke);
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
    };
    async logoutUser(tokenToRevoke: string): Promise<Result<null>> {
        const tokenPayload = await this.jwtService.decodeRefreshToken(tokenToRevoke);
        const isSessionTerminated = await this.deviceAuthSessionsRepository.terminateSession(tokenPayload.deviceId);
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
    };
    async requestPasswordRecovery(email: string): Promise<Result<null>> {
        const user = await this.usersRepository.findUserByEmail(email);
        if (!user) {
            return {
                status: ResultStatus.SUCCESS,
                data: null,
                extensions: [],
            };
        }

        const recoveryCode = await this._generateRecoveryCode(user.id);
        const recoveryCodeHash = await this._generateRecoveryCodeHash(recoveryCode);
        const passwordRecoveryInfo = new PasswordRecoveryInfo(
            recoveryCodeHash,
            add(new Date(), passwordRecoveryCodeLifetime)
        );

        const isPasswordRecoveryInfoUpdated = await this.usersRepository
            .updateUserPasswordRecoveryInfo(user.id, passwordRecoveryInfo);
        if (!isPasswordRecoveryInfoUpdated) {
            return {
                status: ResultStatus.INTERNAL_SERVER_ERROR,
                data: null,
                extensions: [],
            };
        }

        this.emailManager.sendPasswordRecoveryMessage(email, recoveryCode)
            .catch(err => console.log('Email send error: ' + err));

        return {
            status: ResultStatus.SUCCESS,
            data: null,
            extensions: [],
        };
    };
    async _generateRecoveryCode(userId: string): Promise<string> {
        return this.jwtService.createPasswordRecoveryCode(userId)
    };
    async _generateRecoveryCodeHash(recoveryCode: string): Promise<string> {
        return this.cryptoService.generateHash(recoveryCode);
    };
    async confirmPasswordRecovery(newPassword: string, recoveryCode: string): Promise<Result<null>> {
        const verifyRecoveryCodeResult = await this._verifyRecoveryCode(recoveryCode);
        if (verifyRecoveryCodeResult.status !== ResultStatus.SUCCESS) {
            return verifyRecoveryCodeResult as Result<null>;
        }

        const user = verifyRecoveryCodeResult.data as UserDBType;

        const isRecoveryCodeDisabled = await this._disableRecoveryCode(user.id);
        if (!isRecoveryCodeDisabled) {
            return {
                status: ResultStatus.INTERNAL_SERVER_ERROR,
                data: null,
                extensions: [],
            };
        }

        const newPasswordHash = await this.cryptoService.generateHash(newPassword);
        const isPasswordUpdated = await this.usersRepository.updateUserPasswordHash(user.id, newPasswordHash);
        if (!isPasswordUpdated) {
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
    };
    async _verifyRecoveryCode(recoveryCode: string): Promise<Result<UserDBType | null>> {
        const userId = await this.jwtService.verifyPasswordRecoveryCode(recoveryCode);
        if (!userId) {
            return {
                status: ResultStatus.BAD_REQUEST,
                data: null,
                extensions: [],
            };
        }

        const user = await this.usersRepository.findUserById(userId);
        if (!user) {
            return {
                status: ResultStatus.BAD_REQUEST,
                data: null,
                extensions: [],
            };
        }

        if (new Date() > user.passwordRecoveryInfo.expirationDate) {
            return {
                status: ResultStatus.BAD_REQUEST,
                data: null,
                extensions: [],
            };
        }

        return {
            status: ResultStatus.SUCCESS,
            data: user,
            extensions: [],
        };
    };
    async _disableRecoveryCode(userId: string): Promise<boolean> {
        const newPasswordRecoveryInfo = this.usersService.generateEmptyPasswordRecoveryInfo();
        return this.usersRepository.updateUserPasswordRecoveryInfo(userId, newPasswordRecoveryInfo);
    };
}