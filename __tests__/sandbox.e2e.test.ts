import {req} from "./test-helpers";
import {SETTINGS} from "../src/settings";

describe('sandbox tests', () => {
    beforeAll(async () => {
        await req
            .delete(SETTINGS.PATH.TESTING + '/all-data');
    });

    it('should be true', () => {
        expect(true).toBe(true);
    });
});