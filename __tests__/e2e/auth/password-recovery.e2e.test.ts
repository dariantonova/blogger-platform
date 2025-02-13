import {MongoMemoryServer} from "mongodb-memory-server";
import {client, runDb} from "../../../src/db/db";
import {requestsLimit} from "../../../src/middlewares/rate-limiting-middleware";
import mongoose from "mongoose";
import {usersTestManager} from "../../test-managers/users-test-manager";
import {HTTP_STATUSES} from "../../../src/utils";
import {CreateUserInputModel} from "../../../src/features/users/models/CreateUserInputModel";
import {authTestManager} from "../../test-managers/auth-test-manager";
import {emailPattern} from "../../datasets/validation/users-validation-data";
import {usersTestRepository} from "../../repositories/users.test.repository";
import {PasswordRecoveryInputModel} from "../../../src/features/auth/types/auth.types";
import {defaultAttemptsIntervalMs, defaultNumberOfAttemptsLimit} from "../../datasets/common-data";
import {container} from "../../../src/composition-root";
import {AttemptsService} from "../../../src/application/attempts.service";

const attemptsService = container.get<AttemptsService>(AttemptsService);

describe('tests for password recovery endpoint', () => {
    let server: MongoMemoryServer;
    let usersData: CreateUserInputModel[];

    beforeAll(async () => {
        server = await MongoMemoryServer.create();
        const uri = server.getUri();

        const res = await runDb(uri);
        expect(res).toBe(true);

        requestsLimit.numberOfAttemptsLimit = 1000;
        requestsLimit.intervalMs = 1000;

        usersData = [
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

        for (const createUserData of usersData) {
            await usersTestManager.createUser(createUserData,
                HTTP_STATUSES.CREATED_201);
        }
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await client.close();
        await server.stop();
    });

    it('should return 400 if email is missing', async () => {
        const data = {};

        const response = await authTestManager.recoverPassword(data, HTTP_STATUSES.BAD_REQUEST_400);
        expect(response.body).toEqual({
            errorsMessages: [
                {
                    field: 'email',
                    message: 'Email is required',
                }
            ],
        });
    });

    it('should return 400 if email is invalid', async () => {
        // not string
        const data1 = {
            email: 4,
        };

        const response1 = await authTestManager.recoverPassword(data1,
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
            email: '',
        };

        const response2 = await authTestManager.recoverPassword(data2,
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
            email: '  ',
        };

        const response3 = await authTestManager.recoverPassword(data3,
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
        const data4 = {
            email: 'example',
        };

        const response4 = await authTestManager.recoverPassword(data4,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response4.body).toEqual({
            errorsMessages: [
                {
                    field: 'email',
                    message: 'Email must match the following pattern: ' + emailPattern,
                }
            ],
        });
    });

    it(`should return 204 if user with specified email doesn't exist`, async () => {
        const data = {
            email: 'random@example.com',
        };

        await authTestManager.recoverPassword(data, HTTP_STATUSES.NO_CONTENT_204);
    });

    it('should return 204 if input data is correct', async () => {
        const data: PasswordRecoveryInputModel = {
            email: usersData[0].email,
        };

        await authTestManager.recoverPassword(data, HTTP_STATUSES.NO_CONTENT_204);

        const dbUser = await usersTestRepository.findUserByEmail(data.email);
        expect(dbUser!.passwordRecoveryInfo.recoveryCodeHash).not.toBe('');
    });

    it('should return 204 when trying to recover password multiple times', async () => {
        const data: PasswordRecoveryInputModel = {
            email: usersData[1].email,
        };

        for (let i = 0; i < 2; i++) {
            await authTestManager.recoverPassword(data, HTTP_STATUSES.NO_CONTENT_204);
        }
    });

    it('should return 429 if too many requests', async () => {
        requestsLimit.numberOfAttemptsLimit = defaultNumberOfAttemptsLimit;
        requestsLimit.intervalMs = defaultAttemptsIntervalMs;

        await attemptsService.deleteAllAttempts();

        const data: PasswordRecoveryInputModel = {
            email: usersData[0].email,
        };

        for (let i = 0; i < requestsLimit.numberOfAttemptsLimit; i++) {
            await authTestManager.recoverPassword(data, HTTP_STATUSES.NO_CONTENT_204);
        }

        await authTestManager.recoverPassword(data, HTTP_STATUSES.TOO_MANY_REQUESTS_429);

        requestsLimit.numberOfAttemptsLimit = 1000;
        requestsLimit.intervalMs = 1000;
    });
});