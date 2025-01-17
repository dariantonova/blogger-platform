import {UserDBType} from "../types/types";
import jwt from 'jsonwebtoken';
import {SETTINGS} from "../settings";

export const jwtSignOptions: jwt.SignOptions = { expiresIn: '7d' };

export const jwtService = {
    async createJwt(user: UserDBType): Promise<string> {
        const payload = { userId: user.id };
        const secret = SETTINGS.JWT_SECRET;
        return jwt.sign(payload, secret, jwtSignOptions);
    },
    async getUserIdByToken(token: string): Promise<string | null> {
        try {
            const payload: any = jwt.verify(token, SETTINGS.JWT_SECRET);
            return payload.userId;
        }
        catch (err) {
            return null;
        }
    },
};