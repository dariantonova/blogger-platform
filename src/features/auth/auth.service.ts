import {usersRepository} from "../users/repositories/users.repository";
import {cryptoService} from "../../services/crypto.service";
import {jwtService} from "../../application/jwt.service";
import {UserDBType} from "../../types/types";

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
}