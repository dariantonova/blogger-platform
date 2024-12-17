import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {client} from "../../src/db/db";

describe('sandbox tests', () => {
    beforeAll(async () => {
        await req
            .delete(SETTINGS.PATH.TESTING + '/all-data');
    });

    afterAll(async () => {
        await client.close();
    });

    it('should be true', () => {
        expect(true).toBe(true);
    });

});