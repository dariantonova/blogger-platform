import {VALID_AUTH} from "../datasets/authorization-data";
import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {HTTP_STATUSES} from "../../src/utils";
import {UserViewModel} from "../../src/features/users/models/UserViewModel";
import {authTestManager} from "./auth-test-manager";
import {LoginInputModel} from "../../src/routes/auth.router";
import {Paginator} from "../../src/types";

export const userTestManager = {
    async getUsers(expectedStatusCode: number, query: string = '', auth: string = VALID_AUTH) {
        const response = await req
            .get(SETTINGS.PATH.USERS + '?' + query)
            .set('Authorization', auth)
            .expect(expectedStatusCode);

        return response;
    },
    async createUser(data: any, expectedStatusCode: number, auth: string = VALID_AUTH) {
        const response = await req
            .post(SETTINGS.PATH.USERS)
            .set('Authorization', auth)
            .send(data)
            .expect(expectedStatusCode);

        if (expectedStatusCode === HTTP_STATUSES.CREATED_201) {
            const createdUser: UserViewModel = response.body;

            expect(createdUser).toEqual({
                id: expect.any(String),
                login: data.login,
                email: data.email,
                createdAt: expect.any(String),
            });

            const loginData: LoginInputModel = {
                loginOrEmail: data.login,
                password: data.password,
            };
            await authTestManager.login(loginData, HTTP_STATUSES.NO_CONTENT_204);
        }

        return response;
    },
    async checkUsersQuantity(quantity: number) {
        const getUsersResponse = await this.getUsers(HTTP_STATUSES.OK_200);
        const usersPaginator: Paginator<UserViewModel> = getUsersResponse.body;
        expect(usersPaginator.totalCount).toEqual(quantity);
    },
};