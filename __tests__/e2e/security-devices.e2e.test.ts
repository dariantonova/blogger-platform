import {MongoMemoryServer} from "mongodb-memory-server";
import {client, runDb} from "../../src/db/db";
import {requestsLimit} from "../../src/middlewares/rate-limiting-middleware";
import {CreateUserInputModel} from "../../src/features/users/models/CreateUserInputModel";
import {usersTestManager} from "../test-managers/users-test-manager";
import {HTTP_STATUSES} from "../../src/utils";
import {securityDevicesTestManager} from "../test-managers/security-devices-test-manager";
import {DeviceViewModel} from "../../src/features/auth/types/auth.types";
import {authTestManager} from "../test-managers/auth-test-manager";
import {req} from "../test-helpers";
import {Cookie, CookieAccessInfo} from "cookiejar";
import {SETTINGS} from "../../src/settings";
import {defaultRefreshTokenLife} from "../datasets/authorization-data";
import mongoose from "mongoose";


describe('tests for /security/devices', () => {
    let server: MongoMemoryServer;
    let createUsersData: CreateUserInputModel[];
    let refreshTokens: { user1: string[], user2: string[] } = { user1: [], user2: [] };
    let deviceIds: { user1: string[], user2: string[] } = { user1: [], user2: [] };

    const timeout = (ms: number) => {
        return new Promise(res => setTimeout(res, ms));
    };

    beforeAll(async () => {
        server = await MongoMemoryServer.create();
        const uri = server.getUri();

        const res = await runDb(uri);
        expect(res).toBe(true);

        requestsLimit.numberOfAttemptsLimit = 1000;

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

        for (const createUserData of createUsersData) {
            await usersTestManager.createUser(createUserData,
                HTTP_STATUSES.CREATED_201);
        }

        const user2Data = createUsersData[1];
        const user2RefreshToken = await securityDevicesTestManager.getNewRefreshToken(
            user2Data.login, user2Data.password, 'agent1'
        );
        refreshTokens.user2.push(user2RefreshToken);
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await client.close();
        await server.stop();
    });

    it('should return one device session', async () => {
        const userData = createUsersData[0];
        const refreshToken = await securityDevicesTestManager.getNewRefreshToken(
            userData.login, userData.password, 'agent1'
        );
        refreshTokens.user1.push(refreshToken);
        const deviceId = await securityDevicesTestManager.getRefreshTokenDeviceId(refreshToken);
        deviceIds.user1.push(deviceId);

        const sessionsResponse = await securityDevicesTestManager.getDeviceSessions(
            refreshToken, HTTP_STATUSES.OK_200);
        const sessions = sessionsResponse.body;
        expect(sessions.length).toBe(1);
        expect(sessions[0].deviceId).toBe(deviceId);
        expect(sessions[0].title).toBe('agent1');
        expect(sessions[0]).toEqual({
            ip: expect.any(String),
            title: expect.any(String),
            lastActiveDate: expect.any(String),
            deviceId: expect.any(String),
        });
    });

    it('should return 403 if user tries to terminate session of another user', async () => {
        const user2RefreshToken = refreshTokens.user2[0];
        const user2DeviceId = await securityDevicesTestManager.getRefreshTokenDeviceId(user2RefreshToken);

        const user1RefreshToken = refreshTokens.user1[0];
        await securityDevicesTestManager.terminateDeviceSession(
            user2DeviceId, user1RefreshToken, HTTP_STATUSES.FORBIDDEN_403
        );

        const sessionsResponse = await securityDevicesTestManager.getDeviceSessions(
            user2RefreshToken, HTTP_STATUSES.OK_200);
        const sessions = sessionsResponse.body;
        expect(sessions.length).toBe(1);
    });

    it('should return all device sessions of user', async () => {
        const userData = createUsersData[0];

        const deviceId1 = deviceIds.user1[0];

        const refreshToken2 = await securityDevicesTestManager.getNewRefreshToken(
            userData.login, userData.password, 'agent2'
        );
        refreshTokens.user1.push(refreshToken2);
        const deviceId2 = await securityDevicesTestManager.getRefreshTokenDeviceId(refreshToken2);
        deviceIds.user1.push(deviceId2);

        const refreshToken3 = await securityDevicesTestManager.getNewRefreshToken(
            userData.login, userData.password, 'agent3'
        );
        refreshTokens.user1.push(refreshToken3);
        const deviceId3 = await securityDevicesTestManager.getRefreshTokenDeviceId(refreshToken3);
        deviceIds.user1.push(deviceId3);

        const refreshToken4 = await securityDevicesTestManager.getNewRefreshToken(
            userData.login, userData.password, 'agent4'
        );
        refreshTokens.user1.push(refreshToken4);
        const deviceId4 = await securityDevicesTestManager.getRefreshTokenDeviceId(refreshToken4);
        deviceIds.user1.push(deviceId4);

        const sessionsResponse = await securityDevicesTestManager.getDeviceSessions(
            refreshToken2, HTTP_STATUSES.OK_200);
        const sessions = sessionsResponse.body;
        expect(sessions.length).toBe(4);
        expect(sessions.map((s: DeviceViewModel) => s.deviceId)).toEqual([
            deviceId1, deviceId2, deviceId3, deviceId4
        ]);
        expect(sessions.map((s: DeviceViewModel) => s.title)).toEqual([
            'agent1', 'agent2', 'agent3', 'agent4'
        ]);
        for (const session of sessions) {
            expect(session).toEqual({
                ip: expect.any(String),
                title: expect.any(String),
                lastActiveDate: expect.any(String),
                deviceId: expect.any(String),
            });
        }
    });

    it('should update last active date of device session', async () => {
        const refreshToken1 = refreshTokens.user1[0];
        const sessionsBeforeRefreshResponse = await securityDevicesTestManager.getDeviceSessions(
            refreshToken1, HTTP_STATUSES.OK_200);
        const sessionsBeforeRefresh = sessionsBeforeRefreshResponse.body;

        await timeout(1000);

        await authTestManager.refreshToken(refreshToken1, HTTP_STATUSES.OK_200);

        const cookie = req.jar.getCookie('refreshToken', CookieAccessInfo.All) as Cookie;
        const newRefreshToken1 = cookie.value;
        refreshTokens.user1[0] = newRefreshToken1;

        await authTestManager.refreshToken(refreshToken1, HTTP_STATUSES.UNAUTHORIZED_401);
        await authTestManager.logout(refreshToken1, HTTP_STATUSES.UNAUTHORIZED_401);

        const sessionsAfterRefreshResponse = await securityDevicesTestManager.getDeviceSessions(
            newRefreshToken1, HTTP_STATUSES.OK_200);
        const sessionsAfterRefresh = sessionsAfterRefreshResponse.body;

        expect(sessionsAfterRefresh.length).toBe(4);
        expect(sessionsAfterRefresh.map((s: DeviceViewModel) => s.deviceId)).toEqual([
            deviceIds.user1[0], deviceIds.user1[1], deviceIds.user1[2], deviceIds.user1[3]
        ]);
        expect(sessionsAfterRefresh[0].lastActiveDate).not.toBe(sessionsBeforeRefresh[0].lastActiveDate);
    });

    it('should terminate second device session', async () => {
        await securityDevicesTestManager.terminateDeviceSession(
            deviceIds.user1[1], refreshTokens.user1[0], HTTP_STATUSES.NO_CONTENT_204
        );

        const sessionsResponse = await securityDevicesTestManager.getDeviceSessions(
            refreshTokens.user1[0], HTTP_STATUSES.OK_200);
        const sessions = sessionsResponse.body;
        expect(sessions.map((s: DeviceViewModel) => s.deviceId)).toEqual([
            deviceIds.user1[0], deviceIds.user1[2], deviceIds.user1[3]
        ]);
    });

    it('should not return session that was terminated by logout', async () => {
        await authTestManager.logout(refreshTokens.user1[2], HTTP_STATUSES.NO_CONTENT_204);

        const sessionsResponse = await securityDevicesTestManager.getDeviceSessions(
            refreshTokens.user1[0], HTTP_STATUSES.OK_200);
        const sessions = sessionsResponse.body;
        expect(sessions.map((s: DeviceViewModel) => s.deviceId)).toEqual([
            deviceIds.user1[0], deviceIds.user1[3]
        ]);
    });

    it('should return only the first session after terminating all others', async () => {
        await securityDevicesTestManager.terminateOtherDeviceSessions(refreshTokens.user1[0],
            HTTP_STATUSES.NO_CONTENT_204);

        const sessionsResponse = await securityDevicesTestManager.getDeviceSessions(
            refreshTokens.user1[0], HTTP_STATUSES.OK_200);
        const sessions = sessionsResponse.body;
        expect(sessions.map((s: DeviceViewModel) => s.deviceId)).toEqual([deviceIds.user1[0]]);
    });

    it('should return 204 when terminating other sessions if only the current one exists',
        async () => {
            await securityDevicesTestManager.terminateOtherDeviceSessions(refreshTokens.user1[0],
                HTTP_STATUSES.NO_CONTENT_204);

            const sessionsResponse = await securityDevicesTestManager.getDeviceSessions(
                refreshTokens.user1[0], HTTP_STATUSES.OK_200);
            const sessions = sessionsResponse.body;
            expect(sessions.map((s: DeviceViewModel) => s.deviceId)).toEqual([deviceIds.user1[0]]);
    });

    it('should return 404 when trying to terminate non-existing device session', async () => {
        await securityDevicesTestManager.terminateDeviceSession(
            'non-existing', refreshTokens.user1[0], HTTP_STATUSES.NOT_FOUND_404
        );

        // terminated
        await securityDevicesTestManager.terminateDeviceSession(
            deviceIds.user1[1], refreshTokens.user1[0], HTTP_STATUSES.NOT_FOUND_404
        );
    });

    it('should return 401 if refresh token is not provided', async () => {
        const userData = createUsersData[0];
        const refreshToken5 = await securityDevicesTestManager.getNewRefreshToken(
            userData.login, userData.password, 'agent5'
        );
        refreshTokens.user1.push(refreshToken5);
        const deviceId5 = await securityDevicesTestManager.getRefreshTokenDeviceId(refreshToken5);
        deviceIds.user1.push(deviceId5);

        await req
            .get(SETTINGS.PATH.SECURITY_DEVICES)
            .expect(HTTP_STATUSES.UNAUTHORIZED_401);

        await req
            .delete(SETTINGS.PATH.SECURITY_DEVICES)
            .expect(HTTP_STATUSES.UNAUTHORIZED_401);

        await req
            .delete(SETTINGS.PATH.SECURITY_DEVICES + '/' + deviceId5)
            .expect(HTTP_STATUSES.UNAUTHORIZED_401);
    });

    it('should return 401 if refresh token is expired', async () => {
        const userData = createUsersData[0];

        const expiresIn = 1000;
        SETTINGS.REFRESH_JWT_LIFE = expiresIn + 'ms';

        const refreshToken = await securityDevicesTestManager.getNewRefreshToken(
            userData.login, userData.password, 'agent6'
        );

        await timeout(expiresIn);

        await securityDevicesTestManager.getDeviceSessions(refreshToken, HTTP_STATUSES.UNAUTHORIZED_401);
        await securityDevicesTestManager.terminateOtherDeviceSessions(refreshToken,
            HTTP_STATUSES.UNAUTHORIZED_401);
        await securityDevicesTestManager.terminateDeviceSession(
            deviceIds.user1[4], refreshToken, HTTP_STATUSES.UNAUTHORIZED_401
        );

        SETTINGS.REFRESH_JWT_LIFE = defaultRefreshTokenLife;
    });

    it('should return 401 if refresh token is an empty string', async () => {
        await securityDevicesTestManager.getDeviceSessions('', HTTP_STATUSES.UNAUTHORIZED_401);
        await securityDevicesTestManager.terminateOtherDeviceSessions('',
            HTTP_STATUSES.UNAUTHORIZED_401);
        await securityDevicesTestManager.terminateDeviceSession(
            deviceIds.user1[4], '', HTTP_STATUSES.UNAUTHORIZED_401
        );
    });

    it('should return 401 if refresh token is not a valid jwt', async () => {
        const refreshToken = 'random';

        await securityDevicesTestManager.getDeviceSessions(refreshToken, HTTP_STATUSES.UNAUTHORIZED_401);
        await securityDevicesTestManager.terminateOtherDeviceSessions(refreshToken,
            HTTP_STATUSES.UNAUTHORIZED_401);
        await securityDevicesTestManager.terminateDeviceSession(
            deviceIds.user1[4], refreshToken, HTTP_STATUSES.UNAUTHORIZED_401
        );
    });

    it('should return 401 if refresh token has already been used', async () => {
        const refreshToken1 = refreshTokens.user1[0];

        await timeout(1000);

        await authTestManager.refreshToken(refreshToken1, HTTP_STATUSES.OK_200);

        const cookie = req.jar.getCookie('refreshToken', CookieAccessInfo.All) as Cookie;
        refreshTokens.user1[0] = cookie.value;

        await securityDevicesTestManager.getDeviceSessions(refreshToken1, HTTP_STATUSES.UNAUTHORIZED_401);
        await securityDevicesTestManager.terminateOtherDeviceSessions(refreshToken1,
            HTTP_STATUSES.UNAUTHORIZED_401);
        await securityDevicesTestManager.terminateDeviceSession(
            deviceIds.user1[4], refreshToken1, HTTP_STATUSES.UNAUTHORIZED_401
        );
    });

    it('should return 401 if refresh token has been revoked', async () => {
        const refreshToken2 = refreshTokens.user1[1];

        await securityDevicesTestManager.getDeviceSessions(refreshToken2, HTTP_STATUSES.UNAUTHORIZED_401);
        await securityDevicesTestManager.terminateOtherDeviceSessions(refreshToken2,
            HTTP_STATUSES.UNAUTHORIZED_401);
        await securityDevicesTestManager.terminateDeviceSession(
            deviceIds.user1[4], refreshToken2, HTTP_STATUSES.UNAUTHORIZED_401
        );
    });
});