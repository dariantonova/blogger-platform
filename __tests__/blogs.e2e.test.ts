import {req} from "./test-helpers";
import {SETTINGS} from "../src/settings";
import {encodeToBase64, HTTP_STATUSES} from "../src/utils";
import {BlogType} from "../src/types";
import {setDB} from "../src/db/db";
import {getValidAuthValue} from "../src/middlewares/authorization-middleware";

describe('tests for /blogs', () => {
    beforeAll(async () => {
        await req
            .delete(SETTINGS.PATH.TESTING + '/all-data');
    });

    it('should return empty array', async () => {
        await req
            .get(SETTINGS.PATH.BLOGS)
            .expect(HTTP_STATUSES.OK_200, []);
    });

    let blogs: BlogType[];
    it('should return array with all blogs', async () => {
        blogs = [
            {
                id: '1',
                name: 'blog 1',
                description: 'superblog 1',
                websiteUrl: 'https://superblog.com/1',
            },
            {
                id: '2',
                name: 'blog 2',
                description: 'superblog 2',
                websiteUrl: 'https://superblog.com/2',
            },
        ];
        setDB({ blogs });

        await req
            .get(SETTINGS.PATH.BLOGS)
            .expect(HTTP_STATUSES.OK_200, blogs);
    });

    it('should return 404 for non-existing blog', async () => {
        await req
            .get(SETTINGS.PATH.BLOGS + '/-100')
            .expect(HTTP_STATUSES.NOT_FOUND_404);
    });

    it('should return the second blog', async () => {
        await req
            .get(SETTINGS.PATH.BLOGS + '/2')
            .expect(HTTP_STATUSES.OK_200, blogs[1]);
    });

    it('should forbid deleting blogs for non-admin users', async () => {
        await req
            .delete(SETTINGS.PATH.BLOGS + '/1')
            .expect(HTTP_STATUSES.UNAUTHORIZED_401);

        await req
            .delete(SETTINGS.PATH.BLOGS + '/1')
            .set('Authorization', 'Basic somethingWierd')
            .expect(HTTP_STATUSES.UNAUTHORIZED_401);

        await req
            .delete(SETTINGS.PATH.BLOGS + '/1')
            .set('Authorization', 'Basic ')
            .expect(HTTP_STATUSES.UNAUTHORIZED_401);

        const credentials = SETTINGS.CREDENTIALS.LOGIN + ':' + SETTINGS.CREDENTIALS.PASSWORD;
        await req
            .delete(SETTINGS.PATH.BLOGS + '/1')
            .set('Authorization', `Bearer ${encodeToBase64(credentials)}`)
            .expect(HTTP_STATUSES.UNAUTHORIZED_401);

        await req
            .delete(SETTINGS.PATH.BLOGS + '/1')
            .set('Authorization', encodeToBase64(credentials))
            .expect(HTTP_STATUSES.UNAUTHORIZED_401);

        await req
            .get(SETTINGS.PATH.BLOGS + '/1')
            .expect(HTTP_STATUSES.OK_200, blogs[0]);
    });

    it('should return 404 when deleting non-existing blog', async () => {
        await req
            .delete(SETTINGS.PATH.BLOGS + '/-100')
            .set('Authorization', getValidAuthValue())
            .expect(HTTP_STATUSES.NOT_FOUND_404);
    });

    it('should delete the first blog', async () => {
        await req
            .delete(SETTINGS.PATH.BLOGS + '/1')
            .set('Authorization', getValidAuthValue())
            .expect(HTTP_STATUSES.NO_CONTENT_204);

        await req
            .get(SETTINGS.PATH.BLOGS + '/1')
            .expect(HTTP_STATUSES.NOT_FOUND_404);

        await req
            .get(SETTINGS.PATH.BLOGS + '/2')
            .expect(HTTP_STATUSES.OK_200, blogs[0]);
    });

    it('should delete the second blog', async () => {
        await req
            .delete(SETTINGS.PATH.BLOGS + '/2')
            .set('Authorization', getValidAuthValue())
            .expect(HTTP_STATUSES.NO_CONTENT_204);

        await req
            .get(SETTINGS.PATH.BLOGS + '/2')
            .expect(HTTP_STATUSES.NOT_FOUND_404);

        await req
            .get(SETTINGS.PATH.BLOGS)
            .expect(HTTP_STATUSES.OK_200, []);
    });
});