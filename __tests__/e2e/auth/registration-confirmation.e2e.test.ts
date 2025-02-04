import {MongoMemoryServer} from "mongodb-memory-server";
import {UserDBType} from "../../../src/types/types";
import {client, runDb, setDb} from "../../../src/db/db";
import {add} from 'date-fns';
import {authTestManager} from "../../test-managers/auth-test-manager";
import {HTTP_STATUSES} from "../../../src/utils";
import {usersTestRepository} from "../../repositories/users.test.repository";
import {RegistrationConfirmationCodeModel} from "../../../src/features/auth/types/auth.types";
import {requestsLimit} from "../../../src/middlewares/rate-limiting-middleware";
import {usersService} from "../../../src/features/users/users.service";
import {attemptsService} from "../../../src/application/attempts.service";
import {defaultNumberOfAttemptsLimit} from "../../datasets/common-data";
import {CreateUserInputModel} from "../../../src/features/users/models/CreateUserInputModel";
import {validUserFieldInput} from "../../datasets/validation/users-validation-data";

describe('tests for registration confirmation endpoint', () => {
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
                createdAt: new Date(),
                passwordHash: 'hash1',
                confirmationInfo: {
                    confirmationCode: 'code1',
                    expirationDate: add(new Date(), { hours: 2 }),
                    isConfirmed: false,
                },
                isDeleted: false,
            },
            {
                id: '2',
                login: 'user2',
                email: 'user2@example.com',
                createdAt: new Date(),
                passwordHash: 'hash2',
                confirmationInfo: {
                    confirmationCode: 'code2',
                    expirationDate: new Date(),
                    isConfirmed: false,
                },
                isDeleted: false,
            },
            {
                id: '3',
                login: 'user3',
                email: 'user3@example.com',
                createdAt: new Date(),
                passwordHash: 'hash3',
                confirmationInfo: {
                    confirmationCode: 'code3',
                    expirationDate: add(new Date(), { hours: 2 }),
                    isConfirmed: false,
                },
                isDeleted: true,
            },
            {
                id: '4',
                login: 'user4',
                email: 'user4@example.com',
                createdAt: new Date(),
                passwordHash: 'hash4',
                confirmationInfo: {
                    confirmationCode: 'code4',
                    expirationDate: new Date(),
                    isConfirmed: true,
                },
                isDeleted: false,
            },
        ];

        await setDb({ users: initialDbUsers });
    });

    afterAll(async () => {
        await client.close();
        await server.stop();
    });

    it('should return 400 if confirmation code is missing', async () => {
        const data = {};

        const response = await authTestManager.confirmRegistration(data,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response.body).toEqual({
            errorsMessages: [
                {
                    field: 'code',
                    message: 'Code is required',
                }
            ],
        });
    });

    it(`should return 400 if confirmation code is invalid`, async () => {
        // not string
        const data1 = {
            code: 4,
        };

        const response1 = await authTestManager.confirmRegistration(data1,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response1.body).toEqual({
            errorsMessages: [
                {
                    field: 'code',
                    message: 'Code must be a string',
                }
            ],
        });

        // empty string
        const data2 = {
            code: '',
        };

        const response2 = await authTestManager.confirmRegistration(data2,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response2.body).toEqual({
            errorsMessages: [
                {
                    field: 'code',
                    message: 'Code must not be empty',
                }
            ],
        });

        // empty string with spaces
        const data3 = {
            code: '  ',
        };

        const response3 = await authTestManager.confirmRegistration(data3,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response3.body).toEqual({
            errorsMessages: [
                {
                    field: 'code',
                    message: 'Code must not be empty',
                }
            ],
        });
    });

    it('should return 400 if confirmation code matches no user', async () => {
        // random code
        const data1: RegistrationConfirmationCodeModel = {
            code: 'random-code',
        };

        const response1 = await authTestManager.confirmRegistration(data1,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response1.body).toEqual({
            errorsMessages: [
                {
                    field: 'code',
                    message: 'Confirmation code is incorrect',
                }
            ],
        });

        // deleted user
        const data2: RegistrationConfirmationCodeModel = {
            code: initialDbUsers[2].confirmationInfo.confirmationCode,
        };

        const response2 = await authTestManager.confirmRegistration(data2,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response2.body).toEqual({
            errorsMessages: [
                {
                    field: 'code',
                    message: 'Confirmation code is incorrect',
                }
            ],
        });
    });

    it('should return 400 if confirmation code is expired', async () => {
        const data: RegistrationConfirmationCodeModel = {
            code: initialDbUsers[1].confirmationInfo.confirmationCode,
        };

        const response = await authTestManager.confirmRegistration(data,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response.body).toEqual({
            errorsMessages: [
                {
                    field: 'code',
                    message: 'Confirmation code is expired',
                }
            ],
        });

        const dbCreatedUser = await usersTestRepository.findUserByConfirmationCode(data.code);
        expect(dbCreatedUser?.confirmationInfo.isConfirmed).toBe(false);
    });

    it('should return 400 if registration is already confirmed', async () => {
        const data: RegistrationConfirmationCodeModel = {
            code: initialDbUsers[3].confirmationInfo.confirmationCode,
        };

        const response = await authTestManager.confirmRegistration(data,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response.body).toEqual({
            errorsMessages: [
                {
                    field: 'code',
                    message: 'Confirmation code has already been applied',
                }
            ],
        });
    });

    it('should confirm registration', async () => {
        const data: RegistrationConfirmationCodeModel = {
            code: initialDbUsers[0].confirmationInfo.confirmationCode,
        };

        await authTestManager.confirmRegistration(data,
            HTTP_STATUSES.NO_CONTENT_204);

        const dbCreatedUser = await usersTestRepository.findUserByConfirmationCode(data.code);
        expect(dbCreatedUser?.confirmationInfo.isConfirmed).toBe(true);
    });

    it(`shouldn't confirm registration user if too many requests`, async () => {
        await usersService.deleteAllUsers();
        await attemptsService.deleteAllAttempts();
        requestsLimit.numberOfAttemptsLimit = defaultNumberOfAttemptsLimit;

        const createUserData: CreateUserInputModel = {
            login: 'user1',
            email: 'user1@example.com',
            password: validUserFieldInput.password,
        };

        await authTestManager.registerUser(createUserData, HTTP_STATUSES.NO_CONTENT_204);

        const confirmationData: RegistrationConfirmationCodeModel = {
            code: 'wrong-code',
        };

        for (let i = 0; i < requestsLimit.numberOfAttemptsLimit; i++) {
            await authTestManager.confirmRegistration(confirmationData,
                HTTP_STATUSES.BAD_REQUEST_400);
        }

        await authTestManager.confirmRegistration(confirmationData,
            HTTP_STATUSES.TOO_MANY_REQUESTS_429);

        requestsLimit.numberOfAttemptsLimit = 1000;
    });
});