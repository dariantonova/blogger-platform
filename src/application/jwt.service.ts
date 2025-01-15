import {UserDBType} from "../types/types";
import jwt from 'jsonwebtoken';
import {SETTINGS} from "../settings";

export const jwtService = {
    async createJwt(user: UserDBType): Promise<string> {
        const payload = { userId: user.id };
        const secret = SETTINGS.JWT_SECRET;
        const options = { expiresIn: '7d' };
        return jwt.sign(payload, secret, options);
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