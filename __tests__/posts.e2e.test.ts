import {req} from "./test-helpers";
import {SETTINGS} from "../src/settings";
import {db, setDB} from "../src/db/db";
import {encodeToBase64, HTTP_STATUSES} from "../src/utils";
import * as datasets from "./datasets";
import {mapPostToViewModel} from "../src/features/posts/posts.controller";
import {PostDBType} from "../src/types";
import {getValidAuthValue} from "../src/middlewares/authorization-middleware";

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

        it(`shouldn't return deleted posts`, async () => {
            const posts = datasets.postsWithDeleted;
            setDB( { posts, blogs: datasets.blogs });

            await req
                .get(SETTINGS.PATH.POSTS)
                .expect(HTTP_STATUSES.OK_200, posts.slice(0, 1).map(mapPostToViewModel));
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

        it(`shouldn't return deleted post`, async () => {
            const posts = datasets.postsWithDeleted;
            setDB( { posts, blogs: datasets.blogs });

            await req
                .get(SETTINGS.PATH.POSTS + '/' + posts[1].id)
                .expect(HTTP_STATUSES.NOT_FOUND_404);
        });
    });

    describe('delete post', () => {
        let posts: PostDBType[];

        beforeAll(() => {
            posts = datasets.posts;
            setDB({ posts, blogs: datasets.blogs });
        });

        afterAll(async () => {
            await req
                .delete(SETTINGS.PATH.TESTING + '/all-data');
        });

        it('should forbid deleting posts for non-admin users', async () => {
            const postToDelete = posts[0];

            await req
                .delete(SETTINGS.PATH.POSTS + '/' + postToDelete.id)
                .expect(HTTP_STATUSES.UNAUTHORIZED_401);

            await req
                .delete(SETTINGS.PATH.POSTS + '/' + postToDelete.id)
                .set('Authorization', 'Basic somethingWeird')
                .expect(HTTP_STATUSES.UNAUTHORIZED_401);

            await req
                .delete(SETTINGS.PATH.POSTS + '/' + postToDelete.id)
                .set('Authorization', 'Basic ')
                .expect(HTTP_STATUSES.UNAUTHORIZED_401);

            const credentials = SETTINGS.CREDENTIALS.LOGIN + ':' + SETTINGS.CREDENTIALS.PASSWORD;
            await req
                .delete(SETTINGS.PATH.POSTS + '/' + postToDelete.id)
                .set('Authorization', `Bearer ${encodeToBase64(credentials)}`)
                .expect(HTTP_STATUSES.UNAUTHORIZED_401);

            await req
                .delete(SETTINGS.PATH.POSTS + '/' + postToDelete.id)
                .set('Authorization', encodeToBase64(credentials))
                .expect(HTTP_STATUSES.UNAUTHORIZED_401);

            await req
                .get(SETTINGS.PATH.POSTS + '/' + postToDelete.id)
                .expect(HTTP_STATUSES.OK_200, mapPostToViewModel(postToDelete));
        });

        it('should return 404 when deleting non-existing post', async () => {
            await req
                .delete(SETTINGS.PATH.POSTS + '/-100')
                .set('Authorization', getValidAuthValue())
                .expect(HTTP_STATUSES.NOT_FOUND_404);
        });

        it('should delete the first post', async () => {
            const postToDelete = posts[0];

            await req
                .delete(SETTINGS.PATH.POSTS + '/' + postToDelete.id)
                .set('Authorization', getValidAuthValue())
                .expect(HTTP_STATUSES.NO_CONTENT_204);

            await req
                .get(SETTINGS.PATH.POSTS + '/' + postToDelete.id)
                .expect(HTTP_STATUSES.NOT_FOUND_404);

            await req
                .get(SETTINGS.PATH.POSTS + '/' + posts[1].id)
                .expect(HTTP_STATUSES.OK_200, mapPostToViewModel(posts[1]));
        });

        it('should delete the second post', async () => {
            const postToDelete = posts[1];

            await req
                .delete(SETTINGS.PATH.POSTS + '/' + postToDelete.id)
                .set('Authorization', getValidAuthValue())
                .expect(HTTP_STATUSES.NO_CONTENT_204);

            await req
                .get(SETTINGS.PATH.POSTS + '/' + postToDelete.id)
                .expect(HTTP_STATUSES.NOT_FOUND_404);

            await req
                .get(SETTINGS.PATH.POSTS)
                .expect(HTTP_STATUSES.OK_200, []);
        });

        it('should return 404 when deleting deleted post', async () => {
            await req
                .delete(SETTINGS.PATH.POSTS + '/' + posts[0].id)
                .set('Authorization', getValidAuthValue())
                .expect(HTTP_STATUSES.NOT_FOUND_404);
        });
    });
});