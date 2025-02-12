import bcrypt from "bcrypt";
import {injectable} from "inversify";

@injectable()
export class CryptoService {
    async generateHash(password: string): Promise<string> {
        const saltRounds = 10;
        return bcrypt.hash(password, saltRounds);
    };
    async compareHash(password: string, passwordHash: string): Promise<boolean> {
        return bcrypt.compare(password, passwordHash);
    };
}