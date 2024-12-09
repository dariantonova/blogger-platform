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
});