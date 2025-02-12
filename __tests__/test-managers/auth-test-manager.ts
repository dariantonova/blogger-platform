import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {HTTP_STATUSES} from "../../src/utils";
import {CreateUserInputModel} from "../../src/features/users/models/CreateUserInputModel";
import {LoginInputModel, MeViewModel} from "../../src/features/auth/types/auth.types";
import {usersTestRepository} from "../repositories/users.test.repository";
import {Response} from 'supertest';
import {Cookie, CookieAccessInfo} from "cookiejar";

export const authTestManager = {
    async login(data: any, expectedStatusCode: number) {
        return req
            .post(SETTINGS.PATH.AUTH + '/login')
            .send(data)
            .expect(expectedStatusCode);
    },
    async checkAccessTokenIsPresent(response: Response) {
        expect(response.body).toEqual({
            accessToken: expect.any(String),
        });
    },
    async verifyRefTokenCookie(): Promise<Cookie> {
        const cookie = req.jar.getCookie('refreshToken', CookieAccessInfo.All) as Cookie;
        expect(cookie).toBeDefined();
        expect(cookie.value.length).toBeGreaterThan(0);
        expect(cookie.path).toBe('/auth');
        expect(cookie.secure).toBe(true);
        expect(cookie.noscript).toBe(true);

        return cookie;
    },
    async getCurrentUserInfo(auth: string, expectedStatusCode: number) {
        return req
            .get(SETTINGS.PATH.AUTH + '/me')
            .set('Authorization', auth)
            .expect(expectedStatusCode);
    },
    async registerUser(data: any, expectedStatusCode: number) {
        return req
            .post(SETTINGS.PATH.AUTH + '/registration')
            .send(data)
            .expect(expectedStatusCode);
    },
    async verifyRegisteredUser(input: CreateUserInputModel) {
        const loginData: LoginInputModel = {
            loginOrEmail: input.login,
            password: input.password,
        };
        const loginResponse = await authTestManager.login(loginData, HTTP_STATUSES.OK_200);
        const token = loginResponse.body.accessToken;

        const getNewUserInfoResponse = await authTestManager.getCurrentUserInfo(
            'Bearer ' + token,
            HTTP_STATUSES.OK_200
        );
        const newUserInfo: MeViewModel = getNewUserInfoResponse.body;

        expect(newUserInfo.login).toBe(input.login);
        expect(newUserInfo.email).toBe(input.email);

        const dbCreatedUser = await usersTestRepository.findUserById(newUserInfo.userId);
        expect(dbCreatedUser?.confirmationInfo.isConfirmed).toBe(false);
        expect(dbCreatedUser?.confirmationInfo.confirmationCode).toEqual(expect.any(String));
        expect(dbCreatedUser?.confirmationInfo.expirationDate).toEqual(expect.any(Date));
    },
    async confirmRegistration(data: any, expectedStatusCode: number) {
        return req
            .post(SETTINGS.PATH.AUTH + '/registration-confirmation')
            .send(data)
            .expect(expectedStatusCode);
    },
    async resendConfirmationEmail(data: any, expectedStatusCode: number) {
        return req
            .post(SETTINGS.PATH.AUTH + '/registration-email-resending')
            .send(data)
            .expect(expectedStatusCode);
    },
    async refreshToken(refToken: string, expectedStatusCode: number) {
        return req
            .post(SETTINGS.PATH.AUTH + '/refresh-token')
            .set('Cookie', 'refreshToken=' + refToken)
            .expect(expectedStatusCode);
    },
    async getNewRefreshToken(loginOrEmail: string, password: string): Promise<string> {
        const loginData: LoginInputModel = {
            loginOrEmail,
            password,
        };
        await authTestManager.login(loginData, HTTP_STATUSES.OK_200);
        const cookie = req.jar.getCookie('refreshToken', CookieAccessInfo.All) as Cookie;
        return cookie.value;
    },
    async logout(refToken: string, expectedStatusCode: number) {
        return req
            .post(SETTINGS.PATH.AUTH + '/logout')
            .set('Cookie', 'refreshToken=' + refToken)
            .expect(expectedStatusCode);
    },
    async recoverPassword(data: any, expectedStatusCode: number) {
        return req
            .post(SETTINGS.PATH.AUTH + '/password-recovery')
            .send(data)
            .expect(expectedStatusCode);
    },
};