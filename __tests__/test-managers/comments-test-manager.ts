import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {CommentDBType} from "../../src/features/comments/comments.types";
import {WithId} from "mongodb";
import {HTTP_STATUSES} from "../../src/utils";
import {container} from "../../src/composition-root";
import {CommentsQueryRepository} from "../../src/features/comments/comments.query.repository";

const commentsQueryRepository = container.get<CommentsQueryRepository>(CommentsQueryRepository);

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
        const expected = await commentsQueryRepository.mapToOutput(comment, null);
        expect(getCommentResponse.body).toEqual(expected);
    },
    async updateCommentLikeStatus(commentId: string, data: any, auth: string, expectedStatusCode: number) {
        return req
            .put(SETTINGS.PATH.COMMENTS + '/' + commentId + '/like-status')
            .set('Authorization', auth)
            .send(data)
            .expect(expectedStatusCode);
    },
    async getComment(commentId: string, expectedStatusCode: number, auth: string = '') {
        return req
            .get(SETTINGS.PATH.COMMENTS + '/' + commentId)
            .set('Authorization', auth)
            .expect(expectedStatusCode);
    },
    async checkCommentLikesCount(commentId: string, likesCount: number, auth: string = '') {
        const getCommentResponse = await this.getComment(commentId, HTTP_STATUSES.OK_200, auth);
        expect(getCommentResponse.body.likesInfo.likesCount).toBe(likesCount);
    },
    async checkCommentDislikesCount(commentId: string, dislikesCount: number, auth: string = '') {
        const getCommentResponse = await this.getComment(commentId, HTTP_STATUSES.OK_200, auth);
        expect(getCommentResponse.body.likesInfo.dislikesCount).toBe(dislikesCount);
    },
};