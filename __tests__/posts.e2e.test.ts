import {req} from "./test-helpers";
import {SETTINGS} from "../src/settings";
import {db, setDB} from "../src/db/db";
import {HTTP_STATUSES} from "../src/utils";
import * as datasets from "./datasets";
import {mapPostToViewModel} from "../src/features/posts/posts.controller";
import {PostDBType} from "../src/types";

describe('tests for /posts', () => {
    beforeAll(async () => {
        await req
            .delete(SETTINGS.PATH.TESTING + '/all-data');
    });

    it('database should be cleared', async () => {
        expect(db.blogs.length).toBe(0);
        expect(db.posts.length).toBe(0);
    });

    describe('get posts', () => {
        afterAll(async () => {
            await req
                .delete(SETTINGS.PATH.TESTING + '/all-data');
        });

        it('should return empty array', async () => {
            await req
                .get(SETTINGS.PATH.POSTS)
                .expect(HTTP_STATUSES.OK_200, []);
        });

        it('should return array with all posts', async () => {
            const posts = datasets.posts;
            setDB({ posts, blogs: datasets.blogs });

            await req
                .get(SETTINGS.PATH.POSTS)
                .expect(HTTP_STATUSES.OK_200, posts.map(mapPostToViewModel));
        });
    });

    describe('get post', () => {
        let posts: PostDBType[];

        beforeAll(() => {
            posts = datasets.posts;
            setDB({ posts, blogs: datasets.blogs });
        });

        afterAll(async () => {
            await req
                .delete(SETTINGS.PATH.TESTING + '/all-data');
        });

        it('should return 404 for non-existing post', async () => {
            await req
                .get(SETTINGS.PATH.POSTS + '/-100')
                .expect(HTTP_STATUSES.NOT_FOUND_404);
        });

        it('should return the second post', async () => {
            await req
                .get(SETTINGS.PATH.POSTS + '/2')
                .expect(HTTP_STATUSES.OK_200, mapPostToViewModel(posts[1]));
        });
    });
});