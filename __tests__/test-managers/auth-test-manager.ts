import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {HTTP_STATUSES} from "../../src/utils";
import {CreateUserInputModel} from "../../src/features/users/models/CreateUserInputModel";
import {LoginInputModel, MeViewModel} from "../../src/features/auth/types/auth.types";
import {usersTestRepository} from "../repositories/users.test.repository";

export const authTestManager = {
    async login(data: any, expectedStatusCode: number) {
        const response = await req
            .post(SETTINGS.PATH.AUTH + '/login')
            .send(data)
            .expect(expectedStatusCode);

        if (expectedStatusCode === HTTP_STATUSES.OK_200) {
            expect(response.body).toEqual({
                accessToken: expect.any(String),
            });
        }

        return response;
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
};