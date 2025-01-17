import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";

export const commentTestManager = {
    async deleteComment(commentId: string, auth: string, expectedStatusCode: number) {
        return req
            .delete(SETTINGS.PATH.COMMENTS + '/' + commentId)
            .set('Authorization', auth)
            .expect(expectedStatusCode);
    },
};