import {usersRepository} from "../users/repositories/users.repository";
import {cryptoService} from "../../services/crypto.service";

export const authService = {
    async checkCredentials(loginOrEmail: string, password: string): Promise<boolean> {
        const user = await usersRepository.findUserByLoginOrEmail(loginOrEmail);
        if (!user) {
            return false;
        }

        return cryptoService.compareHash(password, user.passwordHash);
    },
}