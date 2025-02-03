import {MongoMemoryServer} from "mongodb-memory-server";
import {UserDBType} from "../../../src/types/types";
import {client, runDb, setDb} from "../../../src/db/db";
import {add} from "date-fns";
import {authTestManager} from "../../test-managers/auth-test-manager";
import {HTTP_STATUSES} from "../../../src/utils";
import {RegistrationEmailResending} from "../../../src/features/auth/types/auth.types";
import {requestsLimit} from "../../../src/middlewares/rate-limiting-middleware";

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
                isDeleted: false,
            },
        ];

        await setDb({ users: initialDbUsers });
    });

    afterAll(async () => {
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
});