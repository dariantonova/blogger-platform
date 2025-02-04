import {MongoMemoryServer} from "mongodb-memory-server";
import {client, runDb, setDb} from "../../../src/db/db";
import {nonExistingValidEmail, validUserFieldInput} from "../../datasets/validation/users-validation-data";
import {usersTestManager} from "../../test-managers/users-test-manager";
import {HTTP_STATUSES} from "../../../src/utils";
import {authTestManager} from "../../test-managers/auth-test-manager";
import {UserDBType} from "../../../src/types/types";
import {CreateUserInputModel} from "../../../src/features/users/models/CreateUserInputModel";
import {requestsLimit} from "../../../src/middlewares/rate-limiting-middleware";

describe('tests for registration endpoint', () => {
    let server: MongoMemoryServer;
    let initialDbUsers: UserDBType[];

    beforeAll(async () => {
        server = await MongoMemoryServer.create();
        const uri = server.getUri();

        const res = await runDb(uri);
        expect(res).toBe(true);

        requestsLimit.numberOfAttemptsLimit = 1000;

        initialDbUsers = [
            {
                id: '1',
                login: 'user1',
                email: 'user1@example.com',
                createdAt: new Date('2024-12-16T05:32:26.882Z'),
                passwordHash: 'hash1',
                confirmationInfo: {
                    confirmationCode: '',
                    expirationDate: new Date('2024-12-16T05:32:26.882Z'),
                    isConfirmed: true,
                },
                isDeleted: false,
            },
            {
                id: '2',
                login: 'user2',
                email: 'user2@example.com',
                createdAt: new Date('2024-12-16T05:32:26.882Z'),
                passwordHash: 'hash2',
                confirmationInfo: {
                    confirmationCode: '',
                    expirationDate: new Date('2024-12-16T05:32:26.882Z'),
                    isConfirmed: false,
                },
                isDeleted: false,
            },
            {
                id: '3',
                login: 'user3',
                email: 'user3@example.com',
                createdAt: new Date('2024-12-16T05:32:26.882Z'),
                passwordHash: 'hash3',
                confirmationInfo: {
                    confirmationCode: '',
                    expirationDate: new Date('2024-12-16T05:32:26.882Z'),
                    isConfirmed: true,
                },
                isDeleted: true,
            },
        ];

        await setDb({ users: initialDbUsers });
    });

    afterAll(async () => {
        await client.close();
        await server.stop();
    });

    // validation
    // missing required fields
    it(`shouldn't register user if required fields are missing`, async () => {
        const data1 = {
            email: validUserFieldInput.email,
            password: validUserFieldInput.password,
        };

        const response1 = await authTestManager.registerUser(data1,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response1.body).toEqual({
            errorsMessages: [
                {
                    field: 'login',
                    message: 'Login is required',
                }
            ],
        });

        const data2 = {
            login: validUserFieldInput.login,
            password: validUserFieldInput.password,
        };

        const response2 = await authTestManager.registerUser(data2,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response2.body).toEqual({
            errorsMessages: [
                {
                    field: 'email',
                    message: 'Email is required',
                }
            ],
        });

        const data3 = {
            login: validUserFieldInput.login,
            email: validUserFieldInput.email,
        };

        const response3 = await authTestManager.registerUser(data3,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response3.body).toEqual({
            errorsMessages: [
                {
                    field: 'password',
                    message: 'Password is required',
                }
            ],
        });

        await usersTestManager.checkUsersQuantity(initialDbUsers
            .filter(u => !u.isDeleted).length);
    });

    // login
    it(`shouldn't create user if login is invalid`, async () => {
        // not string
        const data1 = {
            login: 4,
            email: validUserFieldInput.email,
            password: validUserFieldInput.password,
        };

        const response1 = await authTestManager.registerUser(data1,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response1.body).toEqual({
            errorsMessages: [
                {
                    field: 'login',
                    message: 'Login must be a string',
                }
            ],
        });

        // empty string
        const data2 = {
            login: '',
            email: validUserFieldInput.email,
            password: validUserFieldInput.password,
        };

        const response2 = await authTestManager.registerUser(data2,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response2.body).toEqual({
            errorsMessages: [
                {
                    field: 'login',
                    message: 'Login must not be empty',
                }
            ],
        });

        // empty string with spaces
        const data3 = {
            login: '  ',
            email: validUserFieldInput.email,
            password: validUserFieldInput.password,
        };

        const response3 = await authTestManager.registerUser(data3,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response3.body).toEqual({
            errorsMessages: [
                {
                    field: 'login',
                    message: 'Login must not be empty',
                }
            ],
        });

        // too short
        const data4 = {
            login: 'aa',
            email: validUserFieldInput.email,
            password: validUserFieldInput.password,
        };

        const response4 = await authTestManager.registerUser(data4,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response4.body).toEqual({
            errorsMessages: [
                {
                    field: 'login',
                    message: 'Login length must be between 3 and 10 symbols',
                }
            ],
        });

        // too long
        const data5 = {
            login: 'a'.repeat(11),
            email: validUserFieldInput.email,
            password: validUserFieldInput.password,
        };

        const response5 = await authTestManager.registerUser(data5,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response5.body).toEqual({
            errorsMessages: [
                {
                    field: 'login',
                    message: 'Login length must be between 3 and 10 symbols',
                }
            ],
        });

        // wrong format
        const loginPattern = '^[a-zA-Z0-9_-]*$';
        const data6 = {
            login: 'user !',
            email: validUserFieldInput.email,
            password: validUserFieldInput.password,
        };

        const response6 = await authTestManager.registerUser(data6,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response6.body).toEqual({
            errorsMessages: [
                {
                    field: 'login',
                    message: 'Login must match the following pattern: ' + loginPattern,
                }
            ],
        });

        // not unique
        const data7 = {
            login: initialDbUsers[0].login,
            email: validUserFieldInput.email,
            password: validUserFieldInput.password,
        };

        const response7 = await authTestManager.registerUser(data7,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response7.body).toEqual({
            errorsMessages: [
                {
                    field: 'login',
                    message: 'Login must be unique',
                }
            ],
        });

        await usersTestManager.checkUsersQuantity(initialDbUsers
            .filter(u => !u.isDeleted).length);
    });

    // email
    it(`shouldn't create user if email is invalid`, async () => {
        // not string
        const data1 = {
            login: validUserFieldInput.login,
            email: 4,
            password: validUserFieldInput.password,
        };

        const response1 = await authTestManager.registerUser(data1,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response1.body).toEqual({
            errorsMessages: [
                {
                    field: 'email',
                    message: 'Email must be a string',
                }
            ],
        });

        // empty string
        const data2 = {
            login: validUserFieldInput.login,
            email: '',
            password: validUserFieldInput.password,
        };

        const response2 = await authTestManager.registerUser(data2,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response2.body).toEqual({
            errorsMessages: [
                {
                    field: 'email',
                    message: 'Email must not be empty',
                }
            ],
        });

        // empty string with spaces
        const data3 = {
            login: validUserFieldInput.login,
            email: '  ',
            password: validUserFieldInput.password,
        };

        const response3 = await authTestManager.registerUser(data3,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response3.body).toEqual({
            errorsMessages: [
                {
                    field: 'email',
                    message: 'Email must not be empty',
                }
            ],
        });

        // wrong format
        const emailPattern = '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$';
        const data4 = {
            login: validUserFieldInput.login,
            email: 'example',
            password: validUserFieldInput.password,
        };

        const response4 = await authTestManager.registerUser(data4,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response4.body).toEqual({
            errorsMessages: [
                {
                    field: 'email',
                    message: 'Email must match the following pattern: ' + emailPattern,
                }
            ],
        });

        // not unique
        const data5 = {
            login: validUserFieldInput.login,
            email: initialDbUsers[0].email,
            password: validUserFieldInput.password,
        };

        const response5 = await authTestManager.registerUser(data5,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response5.body).toEqual({
            errorsMessages: [
                {
                    field: 'email',
                    message: 'Email must be unique',
                }
            ],
        });

        await usersTestManager.checkUsersQuantity(initialDbUsers
            .filter(u => !u.isDeleted).length);
    });

    // password
    it(`shouldn't create user if password is invalid`, async () => {
        // not string
        const data1 = {
            login: validUserFieldInput.login,
            email: validUserFieldInput.email,
            password: 4,
        };

        const response1 = await authTestManager.registerUser(data1,
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
            login: validUserFieldInput.login,
            email: validUserFieldInput.email,
            password: '',
        };

        const response2 = await authTestManager.registerUser(data2,
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
            login: validUserFieldInput.login,
            email: validUserFieldInput.email,
            password: '  ',
        };

        const response3 = await authTestManager.registerUser(data3,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response3.body).toEqual({
            errorsMessages: [
                {
                    field: 'password',
                    message: 'Password must not be empty',
                }
            ],
        });

        // too short
        const data4 = {
            login: validUserFieldInput.login,
            email: validUserFieldInput.email,
            password: 'a'.repeat(5),
        };

        const response4 = await authTestManager.registerUser(data4,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response4.body).toEqual({
            errorsMessages: [
                {
                    field: 'password',
                    message: 'Password length must be between 6 and 20 symbols',
                }
            ],
        });

        // too long
        const data5 = {
            login: validUserFieldInput.login,
            email: validUserFieldInput.email,
            password: 'a'.repeat(21),
        };

        const response5 = await authTestManager.registerUser(data5,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response5.body).toEqual({
            errorsMessages: [
                {
                    field: 'password',
                    message: 'Password length must be between 6 and 20 symbols',
                }
            ],
        });

        await usersTestManager.checkUsersQuantity(initialDbUsers
            .filter(u => !u.isDeleted).length);
    });

    // multiple fields
    it(`shouldn't create user if multiple fields are invalid`, async () => {
        const data = {
            login: 'a'.repeat(11),
            password: '  ',
        };

        const response = await authTestManager.registerUser(data,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response.body).toEqual({
            errorsMessages: expect.arrayContaining([
                { message: expect.any(String), field: 'login' },
                { message: expect.any(String), field: 'email' },
                { message: expect.any(String), field: 'password' },
            ]),
        });

        await usersTestManager.checkUsersQuantity(initialDbUsers
            .filter(u => !u.isDeleted).length);
    });

    // both login and email are not unique
    it('should return one error if both login and email are not unique', async () => {
        const data = {
            login: initialDbUsers[0].login,
            email: initialDbUsers[0].email,
            password: validUserFieldInput.password,
        };

        const response = await authTestManager.registerUser(data,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response.body).toEqual({
            errorsMessages: [
                {
                    field: 'login',
                    message: 'Login must be unique',
                }
            ],
        });

        await usersTestManager.checkUsersQuantity(initialDbUsers
            .filter(u => !u.isDeleted).length);
    });

    it(`shouldn't register user if login is already taken by an unconfirmed user`,
        async () => {
        const data = {
            login: initialDbUsers[1].login,
            email: validUserFieldInput.email,
            password: validUserFieldInput.password,
        };

        const response = await authTestManager.registerUser(data,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response.body).toEqual({
            errorsMessages: [
                {
                    field: 'login',
                    message: 'Login must be unique',
                }
            ],
        });

            await usersTestManager.checkUsersQuantity(initialDbUsers
                .filter(u => !u.isDeleted).length);
    });

    it(`shouldn't register user if email is already taken by an unconfirmed user`,
        async () => {
        const data = {
            login: validUserFieldInput.login,
            email: initialDbUsers[1].email,
            password: validUserFieldInput.password,
        };

        const response = await authTestManager.registerUser(data,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response.body).toEqual({
            errorsMessages: [
                {
                    field: 'email',
                    message: 'Email must be unique',
                }
            ],
        });

        await usersTestManager.checkUsersQuantity(initialDbUsers
            .filter(u => !u.isDeleted).length);
    });

    it('should register user', async () => {
        const data: CreateUserInputModel = {
            login: validUserFieldInput.login,
            email: nonExistingValidEmail,
            password: validUserFieldInput.password,
        };

        await authTestManager.registerUser(data, HTTP_STATUSES.NO_CONTENT_204);

        await authTestManager.verifyRegisteredUser(data);
    });

    it('should register user that was previously deleted', async () => {
        const data: CreateUserInputModel = {
            login: initialDbUsers[2].login,
            email: initialDbUsers[2].email,
            password: validUserFieldInput.password,
        };

        await authTestManager.registerUser(data, HTTP_STATUSES.NO_CONTENT_204);

        await authTestManager.verifyRegisteredUser(data);
    });
});