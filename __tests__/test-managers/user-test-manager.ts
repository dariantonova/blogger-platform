import {VALID_AUTH} from "../datasets/authorization-data";
import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";

export const userTestManager = {
    async getUsers(expectedStatusCode: number, query: string = '', auth: string = VALID_AUTH) {
        const response = await req
            .get(SETTINGS.PATH.USERS + '?' + query)
            .set('Authorization', auth)
            .expect(expectedStatusCode);

        return response;
    },
};