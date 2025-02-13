import {UserDBType} from "../types/types";
import jwt from 'jsonwebtoken';
import {SETTINGS} from "../settings";
import {injectable} from "inversify";

type RefreshTokenPayload = {
    userId: string,
    deviceId: string,
    exp: number,
    iat: number,
};

@injectable()
export class JwtService {
    async createAccessToken(user: UserDBType): Promise<string> {
        return jwt.sign({ userId: user.id }, SETTINGS.ACCESS_JWT_SECRET,
            { expiresIn: SETTINGS.ACCESS_JWT_LIFE });
    };
    async createRefreshToken(user: UserDBType, deviceId: string): Promise<string> {
        return jwt.sign({ userId: user.id, deviceId }, SETTINGS.REFRESH_JWT_SECRET,
            { expiresIn: SETTINGS.REFRESH_JWT_LIFE });
    };
    async verifyAccessToken(token: string): Promise<string | null> {
        try {
            const payload: any = jwt.verify(token, SETTINGS.ACCESS_JWT_SECRET);
            return payload.userId;
        }
        catch (err) {
            return null;
        }
    };
    async verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
        try {
            return jwt.verify(token, SETTINGS.REFRESH_JWT_SECRET) as RefreshTokenPayload;
        }
        catch (err) {
            return null;
        }
    };
    async decodeRefreshToken(token: string): Promise<RefreshTokenPayload> {
        return jwt.decode(token) as RefreshTokenPayload;
    };
    async createPasswordRecoveryCode(userId: string) {
        return jwt.sign({ userId }, SETTINGS.RECOVERY_JWT_SECRET,
            { expiresIn: SETTINGS.RECOVERY_JWT_LIFE });
    };
    async verifyPasswordRecoveryCode(recoveryCode: string): Promise<string | null> {
        try {
            const payload: any = jwt.verify(recoveryCode, SETTINGS.RECOVERY_JWT_SECRET);
            return payload.userId;
        }
        catch (err) {
            return null;
        }
    };
}