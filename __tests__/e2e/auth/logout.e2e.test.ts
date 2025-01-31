import {MongoMemoryServer} from "mongodb-memory-server";
import {CreateUserInputModel} from "../../../src/features/users/models/CreateUserInputModel";
import {client, runDb} from "../../../src/db/db";
import {userTestManager} from "../../test-managers/user-test-manager";
import {HTTP_STATUSES} from "../../../src/utils";
import {req} from "../../test-helpers";
import {SETTINGS} from "../../../src/settings";
import {authTestManager} from "../../test-managers/auth-test-manager";
import {defaultRefreshTokenLife} from "../../datasets/authorization-data";

describe('tests for logout endpoint', () => {
    let server: MongoMemoryServer;
    let createUsersData: CreateUserInputModel[];
    let createdUserIds: string[];

    const timeout = (ms: number) => {
        return new Promise(res => setTimeout(res, ms));
    };

    beforeAll(async () => {
        server = await MongoMemoryServer.create();
        const uri = server.getUri();

        const res = await runDb(uri);
        expect(res).toBe(true);

        createUsersData = [
            {
                login: 'user1',
                email: 'user1@example.com',
                password: 'qwerty',
            },
            {
                login: 'user2',
                email: 'user2@example.com',
                password: 'qwerty1234',
            },
        ];

        createdUserIds = [];
        for (const createUserData of createUsersData) {
            const createUserResponse = await userTestManager.createUser(createUserData,
                HTTP_STATUSES.CREATED_201);
            createdUserIds.push(createUserResponse.body.id);
        }
    });

    afterAll(async () => {
        await client.close();
        await server.stop();
    });

    it('should return 401 if refresh token is not provided', async () => {
        await req
            .post(SETTINGS.PATH.AUTH + '/logout')
            .expect(HTTP_STATUSES.UNAUTHORIZED_401);
    });

    it('should return 401 if refresh token is expired', async () => {
        const userData = createUsersData[0];

        const expiresIn = 1000;
        SETTINGS.REFRESH_JWT_LIFE = expiresIn + 'ms';

        // get refresh token
        const refreshToken = await authTestManager.getNewRefreshToken(
            userData.login, userData.password
        );

        // wait
        await timeout(expiresIn);

        // try to logout
        await authTestManager.logout(refreshToken, HTTP_STATUSES.UNAUTHORIZED_401);

        SETTINGS.REFRESH_JWT_LIFE = defaultRefreshTokenLife;
    });

    it('should return 401 if refresh token is an empty string', async () => {
        await authTestManager.logout('', HTTP_STATUSES.UNAUTHORIZED_401);
    });

    it('should return 401 if refresh token is not a valid jwt', async () => {
        const randomToken = 'random';
        await authTestManager.logout(randomToken, HTTP_STATUSES.UNAUTHORIZED_401);
    });

    it('should return 401 if refresh token has already been used', async () => {
        const userData = createUsersData[0];
        const refreshToken = await authTestManager.getNewRefreshToken(
            userData.login, userData.password
        );

        await timeout(1000);

        await authTestManager.refreshToken(refreshToken, HTTP_STATUSES.OK_200);
        await authTestManager.logout(refreshToken, HTTP_STATUSES.UNAUTHORIZED_401);
    });

    it('should logout user', async () => {
        const userData = createUsersData[0];
        const refreshToken = await authTestManager.getNewRefreshToken(
            userData.login, userData.password
        );

        await authTestManager.logout(refreshToken, HTTP_STATUSES.NO_CONTENT_204);
    });

    it('should return 401 if refresh token has already been revoked', async () => {
        const userData = createUsersData[0];
        const refreshToken = await authTestManager.getNewRefreshToken(
            userData.login, userData.password
        );

        await authTestManager.logout(refreshToken, HTTP_STATUSES.NO_CONTENT_204);
        await authTestManager.logout(refreshToken, HTTP_STATUSES.UNAUTHORIZED_401);
    });

    it('should return 401 if user of refresh token was deleted', async () => {
        const userData = createUsersData[1];
        const userId = createdUserIds[1];
        const refreshToken1 = await authTestManager.getNewRefreshToken(
            userData.login, userData.password
        );

        await timeout(1000);

        const refreshToken2 = await authTestManager.getNewRefreshToken(
            userData.login, userData.password
        );

        await userTestManager.deleteUser(userId, HTTP_STATUSES.NO_CONTENT_204);

        await authTestManager.logout(refreshToken1, HTTP_STATUSES.UNAUTHORIZED_401);
        await authTestManager.logout(refreshToken2, HTTP_STATUSES.UNAUTHORIZED_401);
    });
});