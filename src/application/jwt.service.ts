import {UserDBType} from "../types/types";
import jwt from 'jsonwebtoken';
import {SETTINGS} from "../settings";

type RefreshTokenPayload = {
    userId: string,
    exp: number,
};

export const jwtService = {
    async createAccessToken(user: UserDBType): Promise<string> {
        return jwt.sign({ userId: user.id }, SETTINGS.ACCESS_JWT_SECRET,
            { expiresIn: SETTINGS.ACCESS_JWT_LIFE });
    },
    async createRefreshToken(user: UserDBType): Promise<string> {
        return jwt.sign({ userId: user.id }, SETTINGS.REFRESH_JWT_SECRET,
            { expiresIn: SETTINGS.REFRESH_JWT_LIFE });
    },
    async verifyAccessToken(token: string): Promise<string | null> {
        try {
            const payload: any = jwt.verify(token, SETTINGS.ACCESS_JWT_SECRET);
            return payload.userId;
        }
        catch (err) {
            return null;
        }
    },
    async verifyRefreshToken(token: string): Promise<string | null> {
        try {
            const payload = jwt.verify(token, SETTINGS.REFRESH_JWT_SECRET) as RefreshTokenPayload;
            return payload.userId;
        }
        catch (err) {
            return null;
        }
    },
    async decodeRefreshToken(token: string) {
        return jwt.decode(token) as RefreshTokenPayload;
    },
    async getRefreshTokenExpDate(token: string): Promise<Date> {
        const payload = jwt.decode(token) as RefreshTokenPayload;
        const refTokenExp = payload.exp;
        return new Date(refTokenExp * 1000);
    },
};