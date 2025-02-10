import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {CommentDBType} from "../../src/features/comments/comments.types";
import {WithId} from "mongodb";
import {HTTP_STATUSES} from "../../src/utils";
import {commentsQueryRepository} from "../../src/composition-root";

export const commentsTestManager = {
    async deleteComment(commentId: string, auth: string, expectedStatusCode: number) {
        return req
            .delete(SETTINGS.PATH.COMMENTS + '/' + commentId)
            .set('Authorization', auth)
            .expect(expectedStatusCode);
    },
    async updateComment(commentId: string, data: any, auth: string, expectedStatusCode: number) {
        return req
            .put(SETTINGS.PATH.COMMENTS + '/' + commentId)
            .set('Authorization', auth)
            .send(data)
            .expect(expectedStatusCode);
    },
    async checkCommentIsTheSame(comment: WithId<CommentDBType>) {
        const getCommentResponse = await req
            .get(SETTINGS.PATH.COMMENTS + '/' + comment._id.toString())
            .expect(HTTP_STATUSES.OK_200);
        const expected = await commentsQueryRepository.mapToOutput(comment);
        expect(getCommentResponse.body).toEqual(expected);
    },
};