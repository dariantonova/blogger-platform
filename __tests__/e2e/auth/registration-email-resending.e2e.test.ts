import {MongoMemoryServer} from "mongodb-memory-server";
import {UserDBType} from "../../../src/types/types";
import {client, runDb, setDb} from "../../../src/db/db";
import {add} from "date-fns";
import {authTestManager} from "../../test-managers/auth-test-manager";
import {HTTP_STATUSES} from "../../../src/utils";
import {RegistrationEmailResending} from "../../../src/features/auth/types/auth.types";
import {requestsLimit} from "../../../src/middlewares/rate-limiting-middleware";
import {defaultNumberOfAttemptsLimit} from "../../datasets/common-data";
import {CreateUserInputModel} from "../../../src/features/users/models/CreateUserInputModel";
import {validUserFieldInput} from "../../datasets/validation/users-validation-data";
import mongoose from "mongoose";
import {container} from "../../../src/composition-root";
import {AttemptsService} from "../../../src/application/attempts.service";
import {UsersService} from "../../../src/features/users/users.service";

const attemptsService = container.get<AttemptsService>(AttemptsService);
const usersService = container.get<UsersService>(UsersService);

describe('tests for registration email resending', () => {
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
                passwordRecoveryInfo: {
                    recoveryCodeHash: '',
                    expirationDate: new Date('2024-12-16T05:32:26.882Z'),
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
                passwordRecoveryInfo: {
                    recoveryCodeHash: '',
                    expirationDate: new Date('2024-12-16T05:32:26.882Z'),
                },
                isDeleted: true,
            },
            {
                id: '3',
                login: 'user3',
                email: 'user3@example.com',
                createdAt: new Date(),
                passwordHash: 'hash3',
                confirmationInfo: {
                    confirmationCode: 'code3',
                    expirationDate: new Date(),
                    isConfirmed: true,
                },
                passwordRecoveryInfo: {
                    recoveryCodeHash: '',
                    expirationDate: new Date('2024-12-16T05:32:26.882Z'),
                },
                isDeleted: false,
            },
        ];

        await setDb({ users: initialDbUsers });
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await client.close();
        await server.stop();
    });

    it('should return 400 if email is missing', async () => {
        const data = {};

        const response = await authTestManager.resendConfirmationEmail(data,
            HTTP_STATUSES.BAD_REQUEST_400);
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

        const response1 = await authTestManager.resendConfirmationEmail(data1,
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

        const response2 = await authTestManager.resendConfirmationEmail(data2,
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

        const response3 = await authTestManager.resendConfirmationEmail(data3,
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
            email: 'example',
        };

        const response4 = await authTestManager.resendConfirmationEmail(data4,
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

    it('should return 400 if there is no user with specified email', async () => {
        const data: RegistrationEmailResending[] = [];
        // random
        const data1: RegistrationEmailResending = {
            email: 'random@example.com',
        };
        data.push(data1);

        // deleted
        const data2: RegistrationEmailResending = {
            email: initialDbUsers[1].email,
        };
        data.push(data2);

        for (const dataItem of data) {
            const response = await authTestManager.resendConfirmationEmail(dataItem,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response.body).toEqual({
                errorsMessages: [
                    {
                        field: 'email',
                        message: 'No user with such email',
                    }
                ],
            });
        }
    });

    it('should return 400 if user with specified email is already confirmed', async () => {
        const data: RegistrationEmailResending = {
            email: initialDbUsers[2].email,
        };

        const response = await authTestManager.resendConfirmationEmail(data,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response.body).toEqual({
            errorsMessages: [
                {
                    field: 'email',
                    message: 'Email is already confirmed',
                }
            ],
        });
    });

    it('should resend registration email', async () => {
        const data: RegistrationEmailResending = {
            email: initialDbUsers[0].email,
        };

        await authTestManager.resendConfirmationEmail(data,
            HTTP_STATUSES.NO_CONTENT_204);
    });

    it(`shouldn't resend registration email if too many requests`, async () => {
        await usersService.deleteAllUsers();
        await attemptsService.deleteAllAttempts();
        requestsLimit.numberOfAttemptsLimit = defaultNumberOfAttemptsLimit;

        const createUserData: CreateUserInputModel = {
            login: 'user1',
            email: 'user1@example.com',
            password: validUserFieldInput.password,
        };

        await authTestManager.registerUser(createUserData, HTTP_STATUSES.NO_CONTENT_204);

        const resendEmailData: RegistrationEmailResending = {
            email: createUserData.email,
        };

        for (let i = 0; i < requestsLimit.numberOfAttemptsLimit; i++) {
            await authTestManager.resendConfirmationEmail(resendEmailData,
                HTTP_STATUSES.NO_CONTENT_204);
        }

        await authTestManager.resendConfirmationEmail(resendEmailData,
            HTTP_STATUSES.TOO_MANY_REQUESTS_429);

        requestsLimit.numberOfAttemptsLimit = 1000;
    });
});