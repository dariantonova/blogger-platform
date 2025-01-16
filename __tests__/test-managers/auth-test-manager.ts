import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {HTTP_STATUSES} from "../../src/utils";

export const authTestManager = {
    async login(data: any, expectedStatusCode: number) {
        const response = await req
            .post(SETTINGS.PATH.AUTH + '/login')
            .send(data)
            .expect(expectedStatusCode);

        if (expectedStatusCode === HTTP_STATUSES.OK_200) {
            expect(response.body).toEqual({
                accessToken: expect.any(String),
            });
        }

        return response;
    },
}