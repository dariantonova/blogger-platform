import {MongoMemoryServer} from "mongodb-memory-server";
import {client, runDb} from "../../src/db/db";
import {CreateUserInputModel} from "../../src/features/users/models/CreateUserInputModel";
import {userTestManager} from "../test-managers/user-test-manager";
import {HTTP_STATUSES} from "../../src/utils";
import {authTestManager} from "../test-managers/auth-test-manager";
import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {validAuthLoginInput} from "../datasets/validation/auth-login-validation-data";
import {LoginInputModel} from "../../src/routes/auth.router";

describe('tests for /auth', () => {
    let server: MongoMemoryServer;

    beforeAll(async () => {
        server = await MongoMemoryServer.create();
        const uri = server.getUri();

        const res = await runDb(uri);
        expect(res).toBe(true);

        await req
            .delete(SETTINGS.PATH.TESTING + '/all-data');
    });

    afterAll(async () => {
        await client.close();
        await server.stop();
    });

    describe('login', () => {
        let createUsersData: CreateUserInputModel[];

        beforeAll(async () => {
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
                {
                    login: 'user3',
                    email: 'user3@example.com',
                    password: '1234qwerty',
                },
            ];

            const createdUserIds = [];
            for (const createUserData of createUsersData) {
                const createUserResponse = await userTestManager.createUser(createUserData,
                    HTTP_STATUSES.CREATED_201);
                createdUserIds.push(createUserResponse.body.id);
            }

            await userTestManager.deleteUser(createdUserIds[2],
                HTTP_STATUSES.NO_CONTENT_204);
        });

        afterAll(async () => {
            await req
                .delete(SETTINGS.PATH.TESTING + '/all-data');
        });

        // required fields are missing
        it('should return 400 if required fields are missing', async () => {
            // login or email
            const data1 = {
                password: 'qwerty',
            };

            const response1 = await authTestManager.login(data1,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'loginOrEmail',
                        message: 'A login or email is required',
                    }
                ],
            });

            // password
            const data2 = {
                loginOrEmail: 'user1',
            };
            const response2 = await authTestManager.login(data2,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'password',
                        message: 'Password is required',
                    }
                ],
            });
        });

        // wrong format login or email
        it('should return 400 if login or email is invalid', async () => {
            // not string
            const data1 = {
                loginOrEmail: 4,
                password: validAuthLoginInput.password,
            };

            const response1 = await authTestManager.login(data1,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'loginOrEmail',
                        message: 'Login or email must be a string',
                    }
                ],
            });

            // empty string
            const data2 = {
                loginOrEmail: '',
                password: validAuthLoginInput.password,
            };

            const response2 = await authTestManager.login(data2,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'loginOrEmail',
                        message: 'Login or email must not be empty',
                    }
                ],
            });

            // empty string with spaces
            const data3 = {
                loginOrEmail: '  ',
                password: validAuthLoginInput.password,
            };

            const response3 = await authTestManager.login(data3,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'loginOrEmail',
                        message: 'Login or email must not be empty',
                    }
                ],
            });
        });

        // wrong format password
        it('should return 400 if password is invalid', async () => {
            // not string
            const data1 = {
                loginOrEmail: validAuthLoginInput.loginOrEmail,
                password: 4,
            };

            const response1 = await authTestManager.login(data1,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'password',
                        message: 'Password must be a string',
                    }
                ],
            });

            // empty string
            const data2 = {
                loginOrEmail: validAuthLoginInput.loginOrEmail,
                password: '',
            };

            const response2 = await authTestManager.login(data2,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'password',
                        message: 'Password must not be empty',
                    }
                ],
            });

            // empty string with spaces
            const data3 = {
                loginOrEmail: validAuthLoginInput.loginOrEmail,
                password: '  ',
            };

            const response3 = await authTestManager.login(data3,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'password',
                        message: 'Password must not be empty',
                    }
                ],
            });
        });

        // both login or email and password are invalid
        it('should return multiple errors if multiple fields are invalid', async () => {
            const data = {
                loginOrEmail: '  ',
            };

            const response = await authTestManager.login(data,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response.body).toEqual({
                errorsMessages: expect.arrayContaining([
                    { field: 'loginOrEmail', message: expect.any(String) },
                    { field: 'password', message: expect.any(String) },
                ]),
            });
        });

        // non-existing login or email
        it(`should return 400 if login or email doesn't exist`, async () => {
            const data: LoginInputModel = {
                loginOrEmail: 'non-existing',
                password: 'qwerty',
            };

            await authTestManager.login(data, HTTP_STATUSES.UNAUTHORIZED_401);
        });

        // wrong password
        it('should return 400 if password is wrong', async () => {
            const data: LoginInputModel = {
                loginOrEmail: createUsersData[0].login,
                password: 'wrong',
            };

            await authTestManager.login(data, HTTP_STATUSES.UNAUTHORIZED_401);
        });

        // login by login
        it('should return 204 if login and password are correct', async () => {
            const data: LoginInputModel = {
                loginOrEmail: createUsersData[0].login,
                password: createUsersData[0].password,
            };

            await authTestManager.login(data, HTTP_STATUSES.NO_CONTENT_204);
        });

        // login by email
        it('should return 204 if email and password are correct', async () => {
            const data: LoginInputModel = {
                loginOrEmail: createUsersData[0].email,
                password: createUsersData[0].password,
            };

            await authTestManager.login(data, HTTP_STATUSES.NO_CONTENT_204);
        });
    });
});