import {container} from "../../../src/composition-root";
import {AttemptsService} from "../../../src/application/attempts.service";
import {MongoMemoryServer} from "mongodb-memory-server";
import {client, runDb, setDb} from "../../../src/db/db";
import {requestsLimit} from "../../../src/middlewares/rate-limiting-middleware";
import {HTTP_STATUSES} from "../../../src/utils";
import mongoose from "mongoose";
import {validUserFieldInput} from "../../datasets/validation/users-validation-data";
import {validRecoveryCode} from "../../datasets/validation/auth-login-validation-data";
import {authTestManager} from "../../test-managers/auth-test-manager";
import {LoginInputModel, NewPasswordRecoveryInputModel} from "../../../src/features/auth/types/auth.types";
import {UserDBType} from "../../../src/types/types";
import {AuthService} from "../../../src/features/auth/auth.service";
import {add} from "date-fns";
import {CryptoService} from "../../../src/application/crypto.service";
import {defaultAttemptsIntervalMs, defaultNumberOfAttemptsLimit} from "../../datasets/common-data";
import {usersTestRepository} from "../../repositories/users.test.repository";

const attemptsService = container.get<AttemptsService>(AttemptsService);
const authService = container.get<AuthService>(AuthService);
const cryptoService = container.get<CryptoService>(CryptoService);

describe('tests for new password endpoint', () => {
    let server: MongoMemoryServer;

    beforeAll(async () => {
        server = await MongoMemoryServer.create();
        const uri = server.getUri();

        const res = await runDb(uri);
        expect(res).toBe(true);

        requestsLimit.numberOfAttemptsLimit = 1000;
        requestsLimit.intervalMs = 1000;
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await client.close();
        await server.stop();
    });

    it('should return 400 if required fields are missing', async () => {
        const data1 = {
            newPassword: validUserFieldInput.password,
        };

        await authTestManager.setNewPassword(data1, HTTP_STATUSES.BAD_REQUEST_400);

        const data2 = {
            recoveryCode: validRecoveryCode,
        };

        await authTestManager.setNewPassword(data2, HTTP_STATUSES.BAD_REQUEST_400);
    });

    it('should return 400 if new password is invalid', async () => {
        // not string
        const data1 = {
            newPassword: 4,
            recoveryCode: validRecoveryCode,
        };

        const response1 = await authTestManager.setNewPassword(data1,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response1.body).toEqual({
            errorsMessages: [
                {
                    field: 'newPassword',
                    message: 'New password must be a string',
                }
            ],
        });

        // empty string
        const data2 = {
            newPassword: '',
            recoveryCode: validRecoveryCode,
        };

        const response2 = await authTestManager.setNewPassword(data2,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response2.body).toEqual({
            errorsMessages: [
                {
                    field: 'newPassword',
                    message: 'New password must not be empty',
                }
            ],
        });

        // empty string with spaces
        const data3 = {
            newPassword: '  ',
            recoveryCode: validRecoveryCode,
        };

        const response3 = await authTestManager.setNewPassword(data3,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response3.body).toEqual({
            errorsMessages: [
                {
                    field: 'newPassword',
                    message: 'New password must not be empty',
                }
            ],
        });

        // too short
        const data4 = {
            newPassword: 'a'.repeat(5),
            recoveryCode: validRecoveryCode,
        };

        const response4 = await authTestManager.setNewPassword(data4,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response4.body).toEqual({
            errorsMessages: [
                {
                    field: 'newPassword',
                    message: 'New password length must be between 6 and 20 symbols',
                }
            ],
        });

        // too long
        const data5 = {
            newPassword: 'a'.repeat(21),
            recoveryCode: validRecoveryCode,
        };

        const response5 = await authTestManager.setNewPassword(data5,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response5.body).toEqual({
            errorsMessages: [
                {
                    field: 'newPassword',
                    message: 'New password length must be between 6 and 20 symbols',
                }
            ],
        });
    });

    it('should return 400 if recovery code is invalid', async () => {
        // not string
        const data1 = {
            newPassword: validUserFieldInput.password,
            recoveryCode: 4,
        };

        const response1 = await authTestManager.setNewPassword(data1,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response1.body).toEqual({
            errorsMessages: [
                {
                    field: 'recoveryCode',
                    message: 'Recovery code must be a string',
                }
            ],
        });

        // empty string
        const data2 = {
            newPassword: validUserFieldInput.password,
            recoveryCode: '',
        };

        const response2 = await authTestManager.setNewPassword(data2,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response2.body).toEqual({
            errorsMessages: [
                {
                    field: 'recoveryCode',
                    message: 'Recovery code must not be empty',
                }
            ],
        });

        // empty string with spaces
        const data3 = {
            newPassword: validUserFieldInput.password,
            recoveryCode: '  ',
        };

        const response3 = await authTestManager.setNewPassword(data3,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response3.body).toEqual({
            errorsMessages: [
                {
                    field: 'recoveryCode',
                    message: 'Recovery code must not be empty',
                }
            ],
        });
    });

    it('should return 400 if multiple fields are invalid', async () => {
        const data = {
            newPassword: '  ',
        };

        const response = await authTestManager.setNewPassword(data,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response.body).toEqual({
            errorsMessages: expect.arrayContaining([
                { message: expect.any(String), field: 'newPassword' },
                { message: expect.any(String), field: 'recoveryCode' },
            ]),
        });
    });

    it('should return 400 if recovery code matches no user', async () => {
        const data: NewPasswordRecoveryInputModel = {
            newPassword: validUserFieldInput.password,
            recoveryCode: 'random',
        };

        await authTestManager.setNewPassword(data, HTTP_STATUSES.BAD_REQUEST_400);
        console.log('n');
    });

    it('should return 400 if recovery code is expired', async () => {
        const recoveryCode = 'code';
        const recoveryCodeHash = await authService._generateRecoveryCodeHash(recoveryCode);

        const initialDbUsers: UserDBType[] = [
            {
                id: '1',
                login: 'user1',
                email: 'user1@example.com',
                createdAt: new Date(),
                passwordHash: 'hash1',
                confirmationInfo: {
                    confirmationCode: '',
                    expirationDate: new Date(),
                    isConfirmed: true,
                },
                passwordRecoveryInfo: {
                    recoveryCodeHash,
                    expirationDate: new Date(),
                },
                isDeleted: false,
            },
        ];

        await setDb({ users: initialDbUsers });

        const data: NewPasswordRecoveryInputModel = {
            newPassword: validUserFieldInput.password,
            recoveryCode,
        };

        await authTestManager.setNewPassword(data, HTTP_STATUSES.BAD_REQUEST_400);

        const user = await usersTestRepository.findUserById(initialDbUsers[0].id);
        expect(user!.passwordHash).toBe(initialDbUsers[0].passwordHash);
    });

    it('should set new password', async () => {
        const password = 'qwerty';
        const passwordHash = await cryptoService.generateHash(password);

        const userId = '1';
        const recoveryCode = await authService._generateRecoveryCode(userId);
        const recoveryCodeHash = await authService._generateRecoveryCodeHash(recoveryCode);

        const initialDbUsers: UserDBType[] = [
            {
                id: userId,
                login: 'user1',
                email: 'user1@example.com',
                createdAt: new Date(),
                passwordHash,
                confirmationInfo: {
                    confirmationCode: '',
                    expirationDate: new Date(),
                    isConfirmed: true,
                },
                passwordRecoveryInfo: {
                    recoveryCodeHash,
                    expirationDate: add(new Date(), { hours: 1 }),
                },
                isDeleted: false,
            },
        ];

        await setDb({ users: initialDbUsers });

        const data: NewPasswordRecoveryInputModel = {
            newPassword: 'qwerty1234',
            recoveryCode,
        };

        await authTestManager.setNewPassword(data, HTTP_STATUSES.NO_CONTENT_204);

        const loginData1: LoginInputModel = {
            loginOrEmail: initialDbUsers[0].login,
            password: data.newPassword,
        };
        await authTestManager.login(loginData1, HTTP_STATUSES.OK_200);

        const loginData2: LoginInputModel = {
            loginOrEmail: initialDbUsers[0].login,
            password,
        };
        await authTestManager.login(loginData2, HTTP_STATUSES.UNAUTHORIZED_401);
    });

    it('should return 400 if recovery code is already used', async () => {
        const userId = '1';
        const recoveryCode = await authService._generateRecoveryCode(userId);
        const recoveryCodeHash = await authService._generateRecoveryCodeHash(recoveryCode);

        const initialDbUsers: UserDBType[] = [
            {
                id: userId,
                login: 'user1',
                email: 'user1@example.com',
                createdAt: new Date(),
                passwordHash: 'hash1',
                confirmationInfo: {
                    confirmationCode: '',
                    expirationDate: new Date(),
                    isConfirmed: true,
                },
                passwordRecoveryInfo: {
                    recoveryCodeHash,
                    expirationDate: add(new Date(), { hours: 1 }),
                },
                isDeleted: false,
            },
        ];

        await setDb({ users: initialDbUsers });

        const data1: NewPasswordRecoveryInputModel = {
            newPassword: 'qwerty1234',
            recoveryCode,
        };

        await authTestManager.setNewPassword(data1, HTTP_STATUSES.NO_CONTENT_204);

        const data2: NewPasswordRecoveryInputModel = {
            newPassword: 'newQwerty',
            recoveryCode,
        };

        await authTestManager.setNewPassword(data2, HTTP_STATUSES.BAD_REQUEST_400);
    });

    it(`shouldn't set new password if too many requests`, async () => {
        requestsLimit.numberOfAttemptsLimit = defaultNumberOfAttemptsLimit;
        requestsLimit.intervalMs = defaultAttemptsIntervalMs;

        await attemptsService.deleteAllAttempts();

        const data: NewPasswordRecoveryInputModel = {
            newPassword: validUserFieldInput.password,
            recoveryCode: '',
        };

        for (let i = 0; i < requestsLimit.numberOfAttemptsLimit; i++) {
            await authTestManager.setNewPassword(data, HTTP_STATUSES.BAD_REQUEST_400);
        }

        await authTestManager.setNewPassword(data, HTTP_STATUSES.TOO_MANY_REQUESTS_429);

        requestsLimit.numberOfAttemptsLimit = 1000;
        requestsLimit.intervalMs = 1000;
    });
});