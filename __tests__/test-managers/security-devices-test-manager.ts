import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {LoginInputModel} from "../../src/features/auth/types/auth.types";
import {HTTP_STATUSES} from "../../src/utils";
import {Cookie, CookieAccessInfo} from "cookiejar";
import {container} from "../../src/composition-root";
import {JwtService} from "../../src/application/jwt.service";

const jwtService = container.get<JwtService>(JwtService);

export const securityDevicesTestManager = {
    async getDeviceSessions(refToken: string, expectedStatusCode: number) {
        return req
            .get(SETTINGS.PATH.SECURITY_DEVICES)
            .set('Cookie', 'refreshToken=' + refToken)
            .expect(expectedStatusCode);
    },
    async terminateOtherDeviceSessions(refToken: string, expectedStatusCode: number) {
        return req
            .delete(SETTINGS.PATH.SECURITY_DEVICES)
            .set('Cookie', 'refreshToken=' + refToken)
            .expect(expectedStatusCode);
    },
    async terminateDeviceSession(deviceId: string, refToken: string, expectedStatusCode: number) {
        return req
            .delete(SETTINGS.PATH.SECURITY_DEVICES + '/' + deviceId)
            .set('Cookie', 'refreshToken=' + refToken)
            .expect(expectedStatusCode);
    },
    async getNewRefreshToken(loginOrEmail: string, password: string, userAgent: string): Promise<string> {
        const loginData: LoginInputModel = {
            loginOrEmail,
            password,
        };
        await req
            .post(SETTINGS.PATH.AUTH + '/login')
            .set('User-Agent', userAgent)
            .send(loginData)
            .expect(HTTP_STATUSES.OK_200);

        const cookie = req.jar.getCookie('refreshToken', CookieAccessInfo.All) as Cookie;
        return cookie.value;
    },
    async getRefreshTokenDeviceId(refToken: string): Promise<string> {
        const tokenPayload = await jwtService.decodeRefreshToken(refToken);
        return tokenPayload.deviceId;
    },
};