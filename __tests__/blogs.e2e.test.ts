import {req} from "./test-helpers";
import {SETTINGS} from "../src/settings";
import {HTTP_STATUSES} from "../src/utils";
import {BlogType} from "../src/types";
import {setDB} from "../src/db/db";

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
    });

    it('should return 404 when deleting non-existing blog', async () => {
        await req
            .delete(SETTINGS.PATH.BLOGS + '/-100')
            .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
            .expect(HTTP_STATUSES.NOT_FOUND_404);
    });

    it('should delete the first blog', async () => {
        await req
            .delete(SETTINGS.PATH.BLOGS + '/1')
            .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
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
            .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
            .expect(HTTP_STATUSES.NO_CONTENT_204);

        await req
            .get(SETTINGS.PATH.BLOGS + '/2')
            .expect(HTTP_STATUSES.NOT_FOUND_404);

        await req
            .get(SETTINGS.PATH.BLOGS)
            .expect(HTTP_STATUSES.OK_200, []);
    });
});