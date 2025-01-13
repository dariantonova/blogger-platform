import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";

export const authTestManager = {
    async login(data: any, expectedStatusCode: number) {
        const response = await req
            .post(SETTINGS.PATH.AUTH + '/login')
            .send(data)
            .expect(expectedStatusCode);

        return response;
    },
}