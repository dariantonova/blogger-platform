import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {client, postsCollection, runDb, setDb} from "../../src/db/db";
import {HTTP_STATUSES} from "../../src/utils";
import {BlogDBType, PostDBType} from "../../src/types";
import {CreatePostInputModel} from "../../src/features/posts/models/CreatePostInputModel";
import {postTestManager} from "../test-managers/post-test-manager";
import {MongoMemoryServer} from "mongodb-memory-server";
import {blogTestManager} from "../test-managers/blog-test-manager";
import {CreateBlogInputModel} from "../../src/features/blogs/models/CreateBlogInputModel";
import {UpdatePostInputModel} from "../../src/features/posts/models/UpdatePostInputModel";
import {invalidAuthValues} from "../datasets/authorization-data";
import {validPostFieldInput} from "../datasets/validation/posts-validation-data";
import {createPostsPaginator} from "../../src/features/posts/posts.controller";
import {DEFAULT_QUERY_VALUES} from "../../src/helpers/query-params-values";
import {invalidPageNumbers, invalidPageSizes} from "../datasets/validation/query-validation-data";
import {postsQueryRepository} from "../../src/features/posts/repositories/posts.query.repository";

describe('tests for /posts', () => {
    let server: MongoMemoryServer;

    beforeAll(async () => {
        server = await MongoMemoryServer.create();
        const uri = server.getUri();

        const res = await runDb(uri);
        expect(res).toBe(true);

        await req
            .delete(SETTINGS.PATH.TESTING + '/all-data');
    });

    afterAll(async () => {
        await client.close();
        await server.stop();
    });

    describe('get posts', () => {
        let initialDbBlogs: BlogDBType[] = [];
        let initialDbPosts: PostDBType[] = [];

        beforeAll(async () => {
            await setDb();
        });
        
        afterAll(async () => {
            await req
                .delete(SETTINGS.PATH.TESTING + '/all-data');
        });

        it('should return empty array', async () => {
            const expected = await createPostsPaginator(
                [],
                DEFAULT_QUERY_VALUES.POSTS.pageNumber,
                DEFAULT_QUERY_VALUES.POSTS.pageSize,
                0,
                0
            );

            await req
                .get(SETTINGS.PATH.POSTS)
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        it('should return array with all posts', async () => {
            initialDbBlogs = [
                {
                    id: '1',
                    name: 'blog 1',
                    description: 'superblog 1',
                    websiteUrl: 'https://superblog.com/1',
                    isDeleted: false,
                    createdAt: '2024-12-15T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '2',
                    name: 'blog 2',
                    description: 'superblog 2',
                    websiteUrl: 'https://superblog.com/2',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '3',
                    name: 'blog 3',
                    description: 'superblog 3',
                    websiteUrl: 'https://superblog.com/3',
                    isDeleted: true,
                    createdAt: '2024-12-17T05:32:26.882Z',
                    isMembership: false,
                },
            ];

            initialDbPosts = [
                {
                    id: '1',
                    title: 'post 1',
                    shortDescription: 'superpost 1',
                    content: 'content of superpost 1',
                    blogId: '2',
                    blogName: 'blog 2',
                    isDeleted: true,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '2',
                    title: 'post 2',
                    shortDescription: 'superpost 2',
                    content: 'content of superpost 2',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '3',
                    title: 'post 3',
                    shortDescription: 'superpost 3',
                    content: 'content of superpost 3',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: true,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '4',
                    title: 'post 4',
                    shortDescription: 'superpost 4',
                    content: 'content of superpost 4',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
            ];

            await setDb({ blogs: initialDbBlogs, posts: initialDbPosts });

            const expectedPosts = initialDbPosts.filter(p => !p.isDeleted);
            const expected = await createPostsPaginator(
                expectedPosts,
                DEFAULT_QUERY_VALUES.POSTS.pageNumber,
                DEFAULT_QUERY_VALUES.POSTS.pageSize,
                1,
                expectedPosts.length,
            );

            await req
                .get(SETTINGS.PATH.POSTS)
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // sorting
        // createdAt desc
        it('should return posts sorted by creation date in desc order', async () => {
            initialDbBlogs = [
                {
                    id: '1',
                    name: 'a blog 1',
                    description: 'superblog 1',
                    websiteUrl: 'https://superblog.com/1',
                    isDeleted: false,
                    createdAt: '2024-12-15T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '2',
                    name: 'b blog 2',
                    description: 'superblog 2',
                    websiteUrl: 'https://superblog.com/2',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '3',
                    name: 'c blog 3',
                    description: 'superblog 3',
                    websiteUrl: 'https://superblog.com/3',
                    isDeleted: false,
                    createdAt: '2024-12-17T05:32:26.882Z',
                    isMembership: false,
                },
            ];

            initialDbPosts = [
                {
                    id: '1',
                    title: 'a post 1',
                    shortDescription: 'a superpost 1',
                    content: 'a content of superpost 1',
                    blogId: '1',
                    blogName: 'a blog 1',
                    isDeleted: true,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '2',
                    title: 'b post 2',
                    shortDescription: 'b superpost 2',
                    content: 'b content of superpost 2',
                    blogId: '2',
                    blogName: 'b blog 2',
                    isDeleted: false,
                    createdAt: '2024-12-17T05:32:26.882Z',
                },
                {
                    id: '3',
                    title: 'c post 3',
                    shortDescription: 'c superpost 3',
                    content: 'c content of superpost 3',
                    blogId: '3',
                    blogName: 'c blog 3',
                    isDeleted: false,
                    createdAt: '2024-12-18T05:32:26.882Z',
                },
                {
                    id: '4',
                    title: 'a post 4',
                    shortDescription: 'a superpost 4',
                    content: 'a content of superpost 4',
                    blogId: '1',
                    blogName: 'a blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
            ];

            await setDb({ blogs: initialDbBlogs, posts: initialDbPosts });

            const expectedPosts = [initialDbPosts[2], initialDbPosts[1], initialDbPosts[3]];
            const expected = await createPostsPaginator(
                expectedPosts,
                DEFAULT_QUERY_VALUES.POSTS.pageNumber,
                DEFAULT_QUERY_VALUES.POSTS.pageSize,
                1,
                expectedPosts.length,
            );

            await req
                .get(SETTINGS.PATH.POSTS + '?sortBy=createdAt&sortDirection=desc')
                .expect(HTTP_STATUSES.OK_200, expected);

            await req
                .get(SETTINGS.PATH.POSTS + '?sortBy=createdAt')
                .expect(HTTP_STATUSES.OK_200, expected);

            await req
                .get(SETTINGS.PATH.POSTS + '?sortDirection=desc')
                .expect(HTTP_STATUSES.OK_200, expected);

            await req
                .get(SETTINGS.PATH.POSTS)
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // createdAt asc
        it('should return posts sorted by creation date in asc order', async () => {
            const expectedPosts = [initialDbPosts[3], initialDbPosts[1], initialDbPosts[2]];
            const expected = await createPostsPaginator(
                expectedPosts,
                DEFAULT_QUERY_VALUES.POSTS.pageNumber,
                DEFAULT_QUERY_VALUES.POSTS.pageSize,
                1,
                expectedPosts.length,
            );

            await req
                .get(SETTINGS.PATH.POSTS + '?sortBy=createdAt&sortDirection=asc')
                .expect(HTTP_STATUSES.OK_200, expected);
            await req
                .get(SETTINGS.PATH.POSTS + '?sortDirection=asc')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // id desc
        it('should return posts sorted by id in desc order', async () => {
            const expectedPosts = [initialDbPosts[3], initialDbPosts[2], initialDbPosts[1]];
            const expected = await createPostsPaginator(
                expectedPosts,
                DEFAULT_QUERY_VALUES.POSTS.pageNumber,
                DEFAULT_QUERY_VALUES.POSTS.pageSize,
                1,
                expectedPosts.length,
            );

            await req
                .get(SETTINGS.PATH.POSTS + '?sortBy=id&sortDirection=desc')
                .expect(HTTP_STATUSES.OK_200, expected);
            await req
                .get(SETTINGS.PATH.POSTS + '?sortBy=id')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // id asc
        it('should return posts sorted by id in asc order', async () => {
            const expectedPosts = [initialDbPosts[1], initialDbPosts[2], initialDbPosts[3]];
            const expected = await createPostsPaginator(
                expectedPosts,
                DEFAULT_QUERY_VALUES.POSTS.pageNumber,
                DEFAULT_QUERY_VALUES.POSTS.pageSize,
                1,
                expectedPosts.length,
            );

            await req
                .get(SETTINGS.PATH.POSTS + '?sortBy=id&sortDirection=asc')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // title desc
        it('should return posts sorted by title in desc order', async () => {
            const expectedPosts = [initialDbPosts[2], initialDbPosts[1], initialDbPosts[3]];
            const expected = await createPostsPaginator(
                expectedPosts,
                DEFAULT_QUERY_VALUES.POSTS.pageNumber,
                DEFAULT_QUERY_VALUES.POSTS.pageSize,
                1,
                expectedPosts.length,
            );

            await req
                .get(SETTINGS.PATH.POSTS + '?sortBy=title&sortDirection=desc')
                .expect(HTTP_STATUSES.OK_200, expected);
            await req
                .get(SETTINGS.PATH.POSTS + '?sortBy=title')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // title asc
        it('should return posts sorted by title in asc order', async () => {
            const expectedPosts = [initialDbPosts[3], initialDbPosts[1], initialDbPosts[2]];
            const expected = await createPostsPaginator(
                expectedPosts,
                DEFAULT_QUERY_VALUES.POSTS.pageNumber,
                DEFAULT_QUERY_VALUES.POSTS.pageSize,
                1,
                expectedPosts.length,
            );

            await req
                .get(SETTINGS.PATH.POSTS + '?sortBy=title&sortDirection=asc')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // shortDescription desc
        it('should return posts sorted by short description in desc order', async () => {
            const expectedPosts = [initialDbPosts[2], initialDbPosts[1], initialDbPosts[3]];
            const expected = await createPostsPaginator(
                expectedPosts,
                DEFAULT_QUERY_VALUES.POSTS.pageNumber,
                DEFAULT_QUERY_VALUES.POSTS.pageSize,
                1,
                expectedPosts.length,
            );

            await req
                .get(SETTINGS.PATH.POSTS + '?sortBy=shortDescription&sortDirection=desc')
                .expect(HTTP_STATUSES.OK_200, expected);
            await req
                .get(SETTINGS.PATH.POSTS + '?sortBy=shortDescription')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // shortDescription asc
        it('should return posts sorted by short description in asc order', async () => {
            const expectedPosts = [initialDbPosts[3], initialDbPosts[1], initialDbPosts[2]];
            const expected = await createPostsPaginator(
                expectedPosts,
                DEFAULT_QUERY_VALUES.POSTS.pageNumber,
                DEFAULT_QUERY_VALUES.POSTS.pageSize,
                1,
                expectedPosts.length,
            );

            await req
                .get(SETTINGS.PATH.POSTS + '?sortBy=shortDescription&sortDirection=asc')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // content desc
        it('should return posts sorted by content in desc order', async () => {
            const expectedPosts = [initialDbPosts[2], initialDbPosts[1], initialDbPosts[3]];
            const expected = await createPostsPaginator(
                expectedPosts,
                DEFAULT_QUERY_VALUES.POSTS.pageNumber,
                DEFAULT_QUERY_VALUES.POSTS.pageSize,
                1,
                expectedPosts.length,
            );

            await req
                .get(SETTINGS.PATH.POSTS + '?sortBy=content&sortDirection=desc')
                .expect(HTTP_STATUSES.OK_200, expected);
            await req
                .get(SETTINGS.PATH.POSTS + '?sortBy=content')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // content asc
        it('should return posts sorted by content in asc order', async () => {
            const expectedPosts = [initialDbPosts[3], initialDbPosts[1], initialDbPosts[2]];
            const expected = await createPostsPaginator(
                expectedPosts,
                DEFAULT_QUERY_VALUES.POSTS.pageNumber,
                DEFAULT_QUERY_VALUES.POSTS.pageSize,
                1,
                expectedPosts.length,
            );

            await req
                .get(SETTINGS.PATH.POSTS + '?sortBy=content&sortDirection=asc')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // blogId desc
        it('should return posts sorted by blog id in desc order', async () => {
            const expectedPosts = [initialDbPosts[2], initialDbPosts[1], initialDbPosts[3]];
            const expected = await createPostsPaginator(
                expectedPosts,
                DEFAULT_QUERY_VALUES.POSTS.pageNumber,
                DEFAULT_QUERY_VALUES.POSTS.pageSize,
                1,
                expectedPosts.length,
            );

            await req
                .get(SETTINGS.PATH.POSTS + '?sortBy=blogId&sortDirection=desc')
                .expect(HTTP_STATUSES.OK_200, expected);
            await req
                .get(SETTINGS.PATH.POSTS + '?sortBy=blogId')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // blogId asc
        it('should return posts sorted by blog id in asc order', async () => {
            const expectedPosts = [initialDbPosts[3], initialDbPosts[1], initialDbPosts[2]];
            const expected = await createPostsPaginator(
                expectedPosts,
                DEFAULT_QUERY_VALUES.POSTS.pageNumber,
                DEFAULT_QUERY_VALUES.POSTS.pageSize,
                1,
                expectedPosts.length,
            );

            await req
                .get(SETTINGS.PATH.POSTS + '?sortBy=blogId&sortDirection=asc')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // blogName desc
        it('should return posts sorted by blog name in desc order', async () => {
            const expectedPosts = [initialDbPosts[2], initialDbPosts[1], initialDbPosts[3]];
            const expected = await createPostsPaginator(
                expectedPosts,
                DEFAULT_QUERY_VALUES.POSTS.pageNumber,
                DEFAULT_QUERY_VALUES.POSTS.pageSize,
                1,
                expectedPosts.length,
            );

            await req
                .get(SETTINGS.PATH.POSTS + '?sortBy=blogName&sortDirection=desc')
                .expect(HTTP_STATUSES.OK_200, expected);
            await req
                .get(SETTINGS.PATH.POSTS + '?sortBy=blogName')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // blogName asc
        it('should return posts sorted by blog name in asc order', async () => {
            const expectedPosts = [initialDbPosts[3], initialDbPosts[1], initialDbPosts[2]];
            const expected = await createPostsPaginator(
                expectedPosts,
                DEFAULT_QUERY_VALUES.POSTS.pageNumber,
                DEFAULT_QUERY_VALUES.POSTS.pageSize,
                1,
                expectedPosts.length,
            );

            await req
                .get(SETTINGS.PATH.POSTS + '?sortBy=blogName&sortDirection=asc')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // bad sort field
        it(`should return posts ordered by _id if sort field doesn't exist`, async () => {
            const expectedPosts = initialDbPosts.slice(1);
            const expected = await createPostsPaginator(
                expectedPosts,
                DEFAULT_QUERY_VALUES.POSTS.pageNumber,
                DEFAULT_QUERY_VALUES.POSTS.pageSize,
                1,
                expectedPosts.length,
            );

            await req
                .get(SETTINGS.PATH.POSTS + '?sortBy=bad')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // pagination
        // invalid pageNumber
        it('should return empty array if page number is invalid', async () => {
            initialDbBlogs = [
                {
                    id: '1',
                    name: 'blog 1',
                    description: 'superblog 1',
                    websiteUrl: 'https://superblog.com/1',
                    isDeleted: false,
                    createdAt: '2024-12-15T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '2',
                    name: 'blog 2',
                    description: 'superblog 2',
                    websiteUrl: 'https://superblog.com/2',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '3',
                    name: 'blog 3',
                    description: 'superblog 3',
                    websiteUrl: 'https://superblog.com/3',
                    isDeleted: true,
                    createdAt: '2024-12-17T05:32:26.882Z',
                    isMembership: false,
                },
            ];

            initialDbPosts = [
                {
                    id: '1',
                    title: 'post 1',
                    shortDescription: 'superpost 1',
                    content: 'content of superpost 1',
                    blogId: '2',
                    blogName: 'blog 2',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '2',
                    title: 'post 2',
                    shortDescription: 'superpost 2',
                    content: 'content of superpost 2',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '3',
                    title: 'post 3',
                    shortDescription: 'superpost 3',
                    content: 'content of superpost 3',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '4',
                    title: 'post 4',
                    shortDescription: 'superpost 4',
                    content: 'content of superpost 4',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '5',
                    title: 'post 5',
                    shortDescription: 'superpost 5',
                    content: 'content of superpost 5',
                    blogId: '2',
                    blogName: 'blog 2',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '6',
                    title: 'post 6',
                    shortDescription: 'superpost 6',
                    content: 'content of superpost 6',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '7',
                    title: 'post 7',
                    shortDescription: 'superpost 7',
                    content: 'content of superpost 7',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '8',
                    title: 'post 8',
                    shortDescription: 'superpost 8',
                    content: 'content of superpost 8',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '9',
                    title: 'post 9',
                    shortDescription: 'superpost 9',
                    content: 'content of superpost 9',
                    blogId: '2',
                    blogName: 'blog 2',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '10',
                    title: 'post 10',
                    shortDescription: 'superpost 10',
                    content: 'content of superpost 10',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '11',
                    title: 'post 11',
                    shortDescription: 'superpost 11',
                    content: 'content of superpost 11',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '12',
                    title: 'post 12',
                    shortDescription: 'superpost 12',
                    content: 'content of superpost 12',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '13',
                    title: 'post 13',
                    shortDescription: 'superpost 13',
                    content: 'content of superpost 13',
                    blogId: '2',
                    blogName: 'blog 2',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '14',
                    title: 'post 14',
                    shortDescription: 'superpost 14',
                    content: 'content of superpost 14',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '15',
                    title: 'post 15',
                    shortDescription: 'superpost 15',
                    content: 'content of superpost 15',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '16',
                    title: 'post 16',
                    shortDescription: 'superpost 16',
                    content: 'content of superpost 16',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '17',
                    title: 'post 17',
                    shortDescription: 'superpost 17',
                    content: 'content of superpost 17',
                    blogId: '2',
                    blogName: 'blog 2',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '18',
                    title: 'post 18',
                    shortDescription: 'superpost 18',
                    content: 'content of superpost 18',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '19',
                    title: 'post 19',
                    shortDescription: 'superpost 19',
                    content: 'content of superpost 19',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '20',
                    title: 'post 20',
                    shortDescription: 'superpost 20',
                    content: 'content of superpost 20',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '21',
                    title: 'post 21',
                    shortDescription: 'superpost 21',
                    content: 'content of superpost 21',
                    blogId: '2',
                    blogName: 'blog 2',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '22',
                    title: 'post 22',
                    shortDescription: 'superpost 22',
                    content: 'content of superpost 22',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '23',
                    title: 'post 23',
                    shortDescription: 'superpost 23',
                    content: 'content of superpost 23',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '24',
                    title: 'post 24',
                    shortDescription: 'superpost 24',
                    content: 'content of superpost 24',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
            ];

            await setDb({ blogs: initialDbBlogs, posts: initialDbPosts });

            for (const invalidPageNumber of invalidPageNumbers) {
                const expected = await createPostsPaginator(
                    [], 0, 0, 0, 0,
                );

                await req
                    .get(SETTINGS.PATH.POSTS + '?pageNumber=' + invalidPageNumber)
                    .expect(HTTP_STATUSES.OK_200, expected);
            }
        });

        // invalid pageSize
        it('should return empty array if page size is invalid', async () => {
            for (const invalidPageSize of invalidPageSizes) {
                const expected = await createPostsPaginator(
                    [], 0, 0, 0, 0,
                );

                await req
                    .get(SETTINGS.PATH.POSTS + '?pageSize=' + invalidPageSize)
                    .expect(HTTP_STATUSES.OK_200, expected);
            }
        });

        // invalid both pageNumber and pageSize
        it('should return empty array if page number and page size are invalid',
            async () => {
                const invalidPageNumber = invalidPageNumbers[0];
                const invalidPageSize = invalidPageSizes[0];

                const expected = await createPostsPaginator(
                    [], 0, 0, 0, 0,
                );

                await req
                    .get(SETTINGS.PATH.POSTS
                        + '?pageNumber=' + invalidPageNumber
                        + '&pageSize=' + invalidPageSize)
                    .expect(HTTP_STATUSES.OK_200, expected);
            });

        // pageNumber* and pageSize defaults
        it('default page number and page size should be correct', async () => {
            const defaultPageSize = 10;
            const defaultPageNumber = 1;

            const expectedPosts = initialDbPosts.slice(0, defaultPageSize);
            const expected = await createPostsPaginator(
                expectedPosts,
                defaultPageNumber,
                defaultPageSize,
                Math.ceil(initialDbPosts.length / defaultPageSize),
                initialDbPosts.length,
            );

            await req
                .get(SETTINGS.PATH.POSTS)
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // non-default pageNumber
        it('should return correct part of posts array if page number is non-default',
            async () => {
                const pageNumber = 2;

                const expectedPosts = initialDbPosts.slice(10, 20);
                const expected = await createPostsPaginator(
                    expectedPosts,
                    pageNumber,
                    DEFAULT_QUERY_VALUES.POSTS.pageSize,
                    Math.ceil(initialDbPosts.length / DEFAULT_QUERY_VALUES.POSTS.pageSize),
                    initialDbPosts.length,
                );

                await req
                    .get(SETTINGS.PATH.POSTS + '?pageNumber=' + pageNumber)
                    .expect(HTTP_STATUSES.OK_200, expected);
            });

        // non-default pageSize
        it('should return correct part of posts array if page size is non-default',
            async () => {
                const pageSize = 15;

                const expectedPosts = initialDbPosts.slice(0, pageSize);
                const expected = await createPostsPaginator(
                    expectedPosts,
                    DEFAULT_QUERY_VALUES.POSTS.pageNumber,
                    pageSize,
                    Math.ceil(initialDbPosts.length / pageSize),
                    initialDbPosts.length,
                );

                await req
                    .get(SETTINGS.PATH.POSTS + '?pageSize=' + pageSize)
                    .expect(HTTP_STATUSES.OK_200, expected);
            });

        // non-default pageNumber and pageSize
        it('should return correct part of posts array if page number and page size are non-default',
            async () => {
                const pageNumber = 3;
                const pageSize = 5;

                const expectedPosts = initialDbPosts.slice((pageNumber - 1) * pageSize,
                    (pageNumber - 1) * pageSize + pageSize);
                const expected = await createPostsPaginator(
                    expectedPosts,
                    pageNumber,
                    pageSize,
                    Math.ceil(initialDbPosts.length / pageSize),
                    initialDbPosts.length,
                );

                await req
                    .get(SETTINGS.PATH.POSTS
                        + '?pageNumber=' + pageNumber
                        + '&pageSize=' + pageSize)
                    .expect(HTTP_STATUSES.OK_200, expected);
            });

        // pageNumber exceeds total number of pages
        it('should return empty array if page number exceeds total number of pages',
            async () => {
                const pagesCount = Math.ceil(initialDbPosts.length / DEFAULT_QUERY_VALUES.POSTS.pageSize);
                const pageNumber = pagesCount + 5;

                const expectedPosts: PostDBType[] = [];
                const expected = await createPostsPaginator(
                    expectedPosts,
                    pageNumber,
                    DEFAULT_QUERY_VALUES.POSTS.pageSize,
                    pagesCount,
                    initialDbPosts.length,
                );

                await req
                    .get(SETTINGS.PATH.POSTS + '?pageNumber=' + pageNumber)
                    .expect(HTTP_STATUSES.OK_200, expected);
            });

        // pageSize is greater than total number of items *
        it('should return all posts if page size is greater than total number of items',
            async () => {
                const pageSize = initialDbPosts.length + 10;

                const expected = await createPostsPaginator(
                    initialDbPosts,
                    DEFAULT_QUERY_VALUES.POSTS.pageNumber,
                    pageSize,
                    Math.ceil(initialDbPosts.length / pageSize),
                    initialDbPosts.length,
                );

                await req
                    .get(SETTINGS.PATH.POSTS + '?pageSize=' + pageSize)
                    .expect(HTTP_STATUSES.OK_200, expected);
            });
    });

    describe('get post', () => {
        let initialDbPosts: PostDBType[];

        beforeAll(async () => {
            const initialDbBlogs: BlogDBType[] = [
                {
                    id: '1',
                    name: 'blog 1',
                    description: 'superblog 1',
                    websiteUrl: 'https://superblog.com/1',
                    isDeleted: false,
                    createdAt: '2024-12-15T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '2',
                    name: 'blog 2',
                    description: 'superblog 2',
                    websiteUrl: 'https://superblog.com/2',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '3',
                    name: 'blog 3',
                    description: 'superblog 3',
                    websiteUrl: 'https://superblog.com/3',
                    isDeleted: true,
                    createdAt: '2024-12-17T05:32:26.882Z',
                    isMembership: false,
                },
            ];

            initialDbPosts = [
                {
                    id: '1',
                    title: 'post 1',
                    shortDescription: 'superpost 1',
                    content: 'content of superpost 1',
                    blogId: '2',
                    blogName: 'blog 2',
                    isDeleted: false,
                    createdAt: '2024-12-15T05:32:26.882Z',
                },
                {
                    id: '2',
                    title: 'post 2',
                    shortDescription: 'superpost 2',
                    content: 'content of superpost 2',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '3',
                    title: 'post 3',
                    shortDescription: 'superpost 3',
                    content: 'content of superpost 3',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: true,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '4',
                    title: 'post 4',
                    shortDescription: 'superpost 4',
                    content: 'content of superpost 4',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
            ];

            await setDb({ blogs: initialDbBlogs, posts: initialDbPosts });
        });

        afterAll(async () => {
            await req
                .delete(SETTINGS.PATH.TESTING + '/all-data');
        });

        it('should return 404 for non-existing post', async () => {
            await req
                .get(SETTINGS.PATH.POSTS + '/-100')
                .expect(HTTP_STATUSES.NOT_FOUND_404);

            // deleted
            const postToGet = initialDbPosts[2];
            await req
                .get(SETTINGS.PATH.POSTS + '/' + postToGet.id)
                .expect(HTTP_STATUSES.NOT_FOUND_404);
        });

        it('should return the second post', async () => {
            const postToGet = initialDbPosts[1];

            const expectedData = await postsQueryRepository._mapToOutput(postToGet);
            await req
                .get(SETTINGS.PATH.POSTS + '/' + postToGet.id)
                .expect(HTTP_STATUSES.OK_200, expectedData);
        });
    });

    describe('delete post', () => {
        let initialDbPosts: PostDBType[];

        beforeAll(async () => {
            const initialDbBlogs: BlogDBType[] =  [
                {
                    id: '1',
                    name: 'blog 1',
                    description: 'superblog 1',
                    websiteUrl: 'https://superblog.com/1',
                    isDeleted: false,
                    createdAt: '2024-12-15T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '2',
                    name: 'blog 2',
                    description: 'superblog 2',
                    websiteUrl: 'https://superblog.com/2',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '3',
                    name: 'blog 3',
                    description: 'superblog 3',
                    websiteUrl: 'https://superblog.com/3',
                    isDeleted: true,
                    createdAt: '2024-12-17T05:32:26.882Z',
                    isMembership: false,
                },
            ];

            initialDbPosts = [
                {
                    id: '1',
                    title: 'post 1',
                    shortDescription: 'superpost 1',
                    content: 'content of superpost 1',
                    blogId: '2',
                    blogName: 'blog 2',
                    isDeleted: false,
                    createdAt: '2024-12-15T05:32:26.882Z',
                },
                {
                    id: '2',
                    title: 'post 2',
                    shortDescription: 'superpost 2',
                    content: 'content of superpost 2',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '3',
                    title: 'post 3',
                    shortDescription: 'superpost 3',
                    content: 'content of superpost 3',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: true,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '4',
                    title: 'post 4',
                    shortDescription: 'superpost 4',
                    content: 'content of superpost 4',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
            ];

            await setDb({ blogs: initialDbBlogs, posts: initialDbPosts });
        });

        afterAll(async () => {
            await req
                .delete(SETTINGS.PATH.TESTING + '/all-data');
        });

        it('should forbid deleting posts for non-admin users', async () => {
            const postToDelete = initialDbPosts[0];

            // no auth
            await req
                .delete(SETTINGS.PATH.POSTS + '/' + postToDelete.id)
                .expect(HTTP_STATUSES.UNAUTHORIZED_401);

            for (const invalidAuthValue of invalidAuthValues) {
                await postTestManager.deletePost(postToDelete.id,
                    HTTP_STATUSES.UNAUTHORIZED_401, invalidAuthValue);
            }

            const dbPostToDelete = await postsCollection
                .findOne({ id: postToDelete.id }, { projection: { _id: 0 } });
            expect(dbPostToDelete).toEqual(postToDelete);
        });

        it('should return 404 when deleting non-existing post', async () => {
            await postTestManager.deletePost('-100',
                HTTP_STATUSES.NOT_FOUND_404);

            // deleted
            const postToDelete = initialDbPosts[2];
            await postTestManager.deletePost(postToDelete.id,
                HTTP_STATUSES.NOT_FOUND_404);
        });

        it('should delete the first post', async () => {
            const postToDelete = initialDbPosts[0];

            await postTestManager.deletePost(postToDelete.id,
                HTTP_STATUSES.NO_CONTENT_204);
        });
    });

    describe('create post', () => {
        let initialDbBlogs: BlogDBType[];
        let validBlogIdInput: string;

        beforeAll(async () => {
            initialDbBlogs =  [
                {
                    id: '1',
                    name: 'blog 1',
                    description: 'superblog 1',
                    websiteUrl: 'https://superblog.com/1',
                    isDeleted: false,
                    createdAt: '2024-12-15T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '2',
                    name: 'blog 2',
                    description: 'superblog 2',
                    websiteUrl: 'https://superblog.com/2',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '3',
                    name: 'blog 3',
                    description: 'superblog 3',
                    websiteUrl: 'https://superblog.com/3',
                    isDeleted: true,
                    createdAt: '2024-12-17T05:32:26.882Z',
                    isMembership: false,
                },
            ];

            await setDb({ blogs: initialDbBlogs });

            validBlogIdInput = initialDbBlogs[0].id;
        });

        afterAll(async () => {
            await req
                .delete(SETTINGS.PATH.TESTING + '/all-data');
        });

        // authorization
        it('should forbid creating posts for non-admin users', async () => {
            const data: CreatePostInputModel = {
                title: validPostFieldInput.title,
                shortDescription: validPostFieldInput.shortDescription,
                content: validPostFieldInput.content,
                blogId: validBlogIdInput,
            };

            // no auth
            await req
                .post(SETTINGS.PATH.POSTS)
                .send(data)
                .expect(HTTP_STATUSES.UNAUTHORIZED_401);

            for (const invalidAuthValue of invalidAuthValues) {
                await postTestManager.createPost(data, HTTP_STATUSES.UNAUTHORIZED_401,
                    invalidAuthValue);
            }

            expect(await postsCollection.find({}).toArray()).toEqual([]);
        });

        // validation
        it(`shouldn't create post if required fields are missing`, async () => {
            const data1 = {
                shortDescription: validPostFieldInput.shortDescription,
                content: validPostFieldInput.content,
                blogId: validBlogIdInput,
            };

            const response1 = await postTestManager.createPost(data1,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'title',
                        message: 'Title is required',
                    }
                ],
            });

            const data2 = {
                title: validPostFieldInput.title,
                content: validPostFieldInput.content,
                blogId: validBlogIdInput,
            };

            const response2 = await postTestManager.createPost(data2,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'shortDescription',
                        message: 'Short description is required',
                    }
                ],
            });

            const data3 = {
                title: validPostFieldInput.title,
                shortDescription: validPostFieldInput.shortDescription,
                blogId: validBlogIdInput,
            };

            const response3 = await postTestManager.createPost(data3,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'content',
                        message: 'Content is required',
                    }
                ],
            });

            const data4 = {
                title: validPostFieldInput.title,
                shortDescription: validPostFieldInput.shortDescription,
                content: validPostFieldInput.content,
            };

            const response4 = await postTestManager.createPost(data4,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'blogId',
                        message: 'Blog id is required',
                    }
                ],
            });

            expect(await postsCollection.find({}).toArray()).toEqual([]);
        });

        it(`shouldn't create post if title is invalid`, async () => {
            const data1 = {
                title: 24,
                shortDescription: validPostFieldInput.shortDescription,
                content: validPostFieldInput.content,
                blogId: validBlogIdInput,
            };

            const response1 = await postTestManager.createPost(data1,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'title',
                        message: 'Title must be a string',
                    }
                ],
            });

            const data2 = {
                title: '',
                shortDescription: validPostFieldInput.shortDescription,
                content: validPostFieldInput.content,
                blogId: validBlogIdInput,
            };

            const response2 = await postTestManager.createPost(data2,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'title',
                        message: 'Title must not be empty',
                    }
                ],
            });

            const data3 = {
                title: '  ',
                shortDescription: validPostFieldInput.shortDescription,
                content: validPostFieldInput.content,
                blogId: validBlogIdInput,
            };

            const response3 = await postTestManager.createPost(data3,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'title',
                        message: 'Title must not be empty',
                    }
                ],
            });

            const data4 = {
                title: 'a'.repeat(31),
                shortDescription: validPostFieldInput.shortDescription,
                content: validPostFieldInput.content,
                blogId: validBlogIdInput,
            };

            const response4 = await postTestManager.createPost(data4,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'title',
                        message: 'Title length must be between 1 and 30 symbols',
                    }
                ],
            });

            expect(await postsCollection.find({}).toArray()).toEqual([]);
        });

        it(`shouldn't create post if short description is invalid`, async () => {
            const data1 = {
                title: validPostFieldInput.title,
                shortDescription: 24,
                content: validPostFieldInput.content,
                blogId: validBlogIdInput,
            };

            const response1 = await postTestManager.createPost(data1,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'shortDescription',
                        message: 'Short description must be a string',
                    }
                ],
            });

            const data2 = {
                title: validPostFieldInput.title,
                shortDescription: '',
                content: validPostFieldInput.content,
                blogId: validBlogIdInput,
            };

            const response2 = await postTestManager.createPost(data2,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'shortDescription',
                        message: 'Short description must not be empty',
                    }
                ],
            });

            const data3 = {
                title: validPostFieldInput.title,
                shortDescription: '  ',
                content: validPostFieldInput.content,
                blogId: validBlogIdInput,
            };

            const response3 = await postTestManager.createPost(data3,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'shortDescription',
                        message: 'Short description must not be empty',
                    }
                ],
            });

            const data4 = {
                title: validPostFieldInput.title,
                shortDescription: 'a'.repeat(101),
                content: validPostFieldInput.content,
                blogId: validBlogIdInput,
            };

            const response4 = await postTestManager.createPost(data4,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'shortDescription',
                        message: 'Short description length must be between 1 and 100 symbols',
                    }
                ],
            });

            expect(await postsCollection.find({}).toArray()).toEqual([]);
        });

        it(`shouldn't create post if content is invalid`, async () => {
            const data1 = {
                title: validPostFieldInput.title,
                shortDescription: validPostFieldInput.shortDescription,
                content: 24,
                blogId: validBlogIdInput,
            };

            const response1 = await postTestManager.createPost(data1,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'content',
                        message: 'Content must be a string',
                    }
                ],
            });

            const data2 = {
                title: validPostFieldInput.title,
                shortDescription: validPostFieldInput.shortDescription,
                content: '',
                blogId: validBlogIdInput,
            };

            const response2 = await postTestManager.createPost(data2,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'content',
                        message: 'Content must not be empty',
                    }
                ],
            });

            const data3 = {
                title: validPostFieldInput.title,
                shortDescription: validPostFieldInput.shortDescription,
                content: '  ',
                blogId: validBlogIdInput,
            };

            const response3 = await postTestManager.createPost(data3,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'content',
                        message: 'Content must not be empty',
                    }
                ],
            });

            const data4 = {
                title: validPostFieldInput.title,
                shortDescription: validPostFieldInput.shortDescription,
                content: 'a'.repeat(1001),
                blogId: validBlogIdInput,
            };

            const response4 = await postTestManager.createPost(data4,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'content',
                        message: 'Content length must be between 1 and 1000 symbols',
                    }
                ],
            });

            expect(await postsCollection.find({}).toArray()).toEqual([]);
        });

        it(`shouldn't create post if blog id is invalid`, async () => {
            const data1 = {
                title: validPostFieldInput.title,
                shortDescription: validPostFieldInput.shortDescription,
                content: validPostFieldInput.content,
                blogId: 1,
            };

            const response1 = await postTestManager.createPost(data1,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'blogId',
                        message: 'Blog id must be a string',
                    }
                ],
            });

            const data2 = {
                title: validPostFieldInput.title,
                shortDescription: validPostFieldInput.shortDescription,
                content: validPostFieldInput.content,
                blogId: '',
            };

            const response2 = await postTestManager.createPost(data2,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'blogId',
                        message: 'Blog id must not be empty',
                    }
                ],
            });

            const data3 = {
                title: validPostFieldInput.title,
                shortDescription: validPostFieldInput.shortDescription,
                content: validPostFieldInput.content,
                blogId: '  ',
            };

            const response3 = await postTestManager.createPost(data3,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'blogId',
                        message: 'Blog id must not be empty',
                    }
                ],
            });

            const data4 = {
                title: validPostFieldInput.title,
                shortDescription: validPostFieldInput.shortDescription,
                content: validPostFieldInput.content,
                blogId: '-100',
            };

            const response4 = await postTestManager.createPost(data4,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'blogId',
                        message: 'Blog id does not exist',
                    }
                ],
            });

            expect(await postsCollection.find({}).toArray()).toEqual([]);
        });

        it(`shouldn't create post if multiple fields are invalid`, async () => {
            const data = {
                title: 'a'.repeat(31),
                shortDescription: '  ',
                blogId: '-100',
            };

            const response = await postTestManager.createPost(data,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response.body).toEqual({
                errorsMessages: expect.arrayContaining([
                    { field: 'title', message: 'Title length must be between 1 and 30 symbols' },
                    { field: 'shortDescription', message: 'Short description must not be empty' },
                    { field: 'content', message: 'Content is required' },
                    { field: 'blogId', message: 'Blog id does not exist' },
                ]),
            });

            expect(await postsCollection.find({}).toArray()).toEqual([]);
        });

        // correct input
        it('should create post if input data is correct', async () => {
            const createBlogData: CreateBlogInputModel = {
                name: 'blog 51',
                description: 'superblog 51',
                websiteUrl: 'https://superblog.com/51',
            }

            const createBlogResponse = await blogTestManager.createBlog(createBlogData,
                HTTP_STATUSES.CREATED_201);
            const createdBlog = createBlogResponse.body;

            const createPostData: CreatePostInputModel = {
                title: 'post 1',
                shortDescription: 'superpost 1',
                content: 'content of superpost 1',
                blogId: createdBlog.id,
            };

            await postTestManager.createPost(createPostData,
                HTTP_STATUSES.CREATED_201);

            const dbPosts = await postsCollection.find({}).toArray();
            expect(dbPosts.length).toBe(1);
        });

        it('should create one more post', async () => {
            const createPostData: CreatePostInputModel = {
                title: 'post 2',
                shortDescription: 'superpost 2',
                content: 'content of superpost 2',
                blogId: initialDbBlogs[0].id,
            };

            await postTestManager.createPost(createPostData,
                HTTP_STATUSES.CREATED_201);

            const dbPosts = await postsCollection.find({}).toArray();
            expect(dbPosts.length).toBe(2);
        });
    });

    describe('update post', () => {
        let initialDbBlogs: BlogDBType[];
        let initialDbPosts: PostDBType[];
        let validBlogIdInput: string;

        beforeAll(async () => {
            initialDbBlogs = [
                {
                    id: '1',
                    name: 'blog 1',
                    description: 'superblog 1',
                    websiteUrl: 'https://superblog.com/1',
                    isDeleted: false,
                    createdAt: '2024-12-15T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '2',
                    name: 'blog 2',
                    description: 'superblog 2',
                    websiteUrl: 'https://superblog.com/2',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '3',
                    name: 'blog 3',
                    description: 'superblog 3',
                    websiteUrl: 'https://superblog.com/3',
                    isDeleted: true,
                    createdAt: '2024-12-17T05:32:26.882Z',
                    isMembership: false,
                },
            ];

            initialDbPosts = [
                {
                    id: '1',
                    title: 'post 1',
                    shortDescription: 'superpost 1',
                    content: 'content of superpost 1',
                    blogId: '2',
                    blogName: 'blog 2',
                    isDeleted: false,
                    createdAt: '2024-12-15T05:32:26.882Z',
                },
                {
                    id: '2',
                    title: 'post 2',
                    shortDescription: 'superpost 2',
                    content: 'content of superpost 2',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '3',
                    title: 'post 3',
                    shortDescription: 'superpost 3',
                    content: 'content of superpost 3',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: true,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '4',
                    title: 'post 4',
                    shortDescription: 'superpost 4',
                    content: 'content of superpost 4',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
            ];

            await setDb({ blogs: initialDbBlogs, posts: initialDbPosts });

            validBlogIdInput = initialDbBlogs[0].id;
        });

        afterAll(async () => {
            await req
                .delete(SETTINGS.PATH.TESTING + '/all-data');
        });

        // authorization
        it('should forbid updating posts for non-admin users', async () => {
            const data: UpdatePostInputModel = {
                title: 'post 51',
                shortDescription: 'superpost 51',
                content: 'content of superpost 51',
                blogId: initialDbBlogs[0].id,
            };
            const postToUpdate = initialDbPosts[0];

            // no auth
            await req
                .put(SETTINGS.PATH.POSTS + '/' + postToUpdate.id)
                .send(data)
                .expect(HTTP_STATUSES.UNAUTHORIZED_401);

            for (const invalidAuthValue of invalidAuthValues) {
                await postTestManager.updatePost(postToUpdate.id, data,
                    HTTP_STATUSES.UNAUTHORIZED_401, invalidAuthValue);
            }

            const dbPostToUpdate = await postsCollection
                .findOne({ id: postToUpdate.id }, { projection: { _id: 0 } });
            expect(dbPostToUpdate).toEqual(postToUpdate);
        });

        // validation
        it(`shouldn't update post if required fields are missing`, async () => {
            const postToUpdate = initialDbPosts[1];

            const data1 = {
                shortDescription: validPostFieldInput.shortDescription,
                content: validPostFieldInput.content,
                blogId: validBlogIdInput,
            };

            const response1 = await postTestManager.updatePost(postToUpdate.id, data1,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'title',
                        message: 'Title is required',
                    }
                ],
            });

            const data2 = {
                title: validPostFieldInput.title,
                content: validPostFieldInput.content,
                blogId: validBlogIdInput,
            };

            const response2 = await postTestManager.updatePost(postToUpdate.id, data2,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'shortDescription',
                        message: 'Short description is required',
                    }
                ],
            });

            const data3 = {
                title: validPostFieldInput.title,
                shortDescription: validPostFieldInput.shortDescription,
                blogId: validBlogIdInput,
            };

            const response3 = await postTestManager.updatePost(postToUpdate.id, data3,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'content',
                        message: 'Content is required',
                    }
                ],
            });

            const data4 = {
                title: validPostFieldInput.title,
                shortDescription: validPostFieldInput.shortDescription,
                content: validPostFieldInput.content,
            };

            const response4 = await postTestManager.updatePost(postToUpdate.id, data4,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'blogId',
                        message: 'Blog id is required',
                    }
                ],
            });

            const dbPostToUpdate = await postsCollection
                .findOne({ id: postToUpdate.id }, { projection: { _id: 0 } });
            expect(dbPostToUpdate).toEqual(postToUpdate);
        });

        it(`shouldn't update post if title is invalid`, async () => {
            const postToUpdate = initialDbPosts[1];

            const data1 = {
                title: 24,
                shortDescription: validPostFieldInput.shortDescription,
                content: validPostFieldInput.content,
                blogId: validBlogIdInput,
            };

            const response1 = await postTestManager.updatePost(postToUpdate.id, data1,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'title',
                        message: 'Title must be a string',
                    }
                ],
            });

            const data2 = {
                title: '',
                shortDescription: validPostFieldInput.shortDescription,
                content: validPostFieldInput.content,
                blogId: validBlogIdInput,
            };

            const response2 = await postTestManager.updatePost(postToUpdate.id, data2,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'title',
                        message: 'Title must not be empty',
                    }
                ],
            });

            const data3 = {
                title: '  ',
                shortDescription: validPostFieldInput.shortDescription,
                content: validPostFieldInput.content,
                blogId: validBlogIdInput,
            };

            const response3 = await postTestManager.updatePost(postToUpdate.id, data3,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'title',
                        message: 'Title must not be empty',
                    }
                ],
            });

            const data4 = {
                title: 'a'.repeat(31),
                shortDescription: validPostFieldInput.shortDescription,
                content: validPostFieldInput.content,
                blogId: validBlogIdInput,
            };

            const response4 = await postTestManager.updatePost(postToUpdate.id, data4,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'title',
                        message: 'Title length must be between 1 and 30 symbols',
                    }
                ],
            });

            const dbPostToUpdate = await postsCollection
                .findOne({ id: postToUpdate.id }, { projection: { _id: 0 } });
            expect(dbPostToUpdate).toEqual(postToUpdate);
        });

        it(`shouldn't update post if short description is invalid`, async () => {
            const postToUpdate = initialDbPosts[1];

            const data1 = {
                title: validPostFieldInput.title,
                shortDescription: 24,
                content: validPostFieldInput.content,
                blogId: validBlogIdInput,
            };

            const response1 = await postTestManager.updatePost(postToUpdate.id, data1,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'shortDescription',
                        message: 'Short description must be a string',
                    }
                ],
            });

            const data2 = {
                title: validPostFieldInput.title,
                shortDescription: '',
                content: validPostFieldInput.content,
                blogId: validBlogIdInput,
            };

            const response2 = await postTestManager.updatePost(postToUpdate.id, data2,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'shortDescription',
                        message: 'Short description must not be empty',
                    }
                ],
            });

            const data3 = {
                title: validPostFieldInput.title,
                shortDescription: '  ',
                content: validPostFieldInput.content,
                blogId: validBlogIdInput,
            };

            const response3 = await postTestManager.updatePost(postToUpdate.id, data3,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'shortDescription',
                        message: 'Short description must not be empty',
                    }
                ],
            });

            const data4 = {
                title: validPostFieldInput.title,
                shortDescription: 'a'.repeat(101),
                content: validPostFieldInput.content,
                blogId: validBlogIdInput,
            };

            const response4 = await postTestManager.updatePost(postToUpdate.id, data4,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'shortDescription',
                        message: 'Short description length must be between 1 and 100 symbols',
                    }
                ],
            });

            const dbPostToUpdate = await postsCollection
                .findOne({ id: postToUpdate.id }, { projection: { _id: 0 } });
            expect(dbPostToUpdate).toEqual(postToUpdate);
        });

        it(`shouldn't update post if content is invalid`, async () => {
            const postToUpdate = initialDbPosts[1];

            const data1 = {
                title: validPostFieldInput.title,
                shortDescription: validPostFieldInput.shortDescription,
                content: 24,
                blogId: validBlogIdInput,
            };

            const response1 = await postTestManager.updatePost(postToUpdate.id, data1,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'content',
                        message: 'Content must be a string',
                    }
                ],
            });

            const data2 = {
                title: validPostFieldInput.title,
                shortDescription: validPostFieldInput.shortDescription,
                content: '',
                blogId: validBlogIdInput,
            };

            const response2 = await postTestManager.updatePost(postToUpdate.id, data2,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'content',
                        message: 'Content must not be empty',
                    }
                ],
            });

            const data3 = {
                title: validPostFieldInput.title,
                shortDescription: validPostFieldInput.shortDescription,
                content: '  ',
                blogId: validBlogIdInput,
            };

            const response3 = await postTestManager.updatePost(postToUpdate.id, data3,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'content',
                        message: 'Content must not be empty',
                    }
                ],
            });

            const data4 = {
                title: validPostFieldInput.title,
                shortDescription: validPostFieldInput.shortDescription,
                content: 'a'.repeat(1001),
                blogId: validBlogIdInput,
            };

            const response4 = await postTestManager.updatePost(postToUpdate.id, data4,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'content',
                        message: 'Content length must be between 1 and 1000 symbols',
                    }
                ],
            });

            const dbPostToUpdate = await postsCollection
                .findOne({ id: postToUpdate.id }, { projection: { _id: 0 } });
            expect(dbPostToUpdate).toEqual(postToUpdate);
        });

        it(`shouldn't update post if blog id is invalid`, async () => {
            const postToUpdate = initialDbPosts[1];

            const data1 = {
                title: validPostFieldInput.title,
                shortDescription: validPostFieldInput.shortDescription,
                content: validPostFieldInput.content,
                blogId: 1,
            };

            const response1 = await postTestManager.updatePost(postToUpdate.id, data1,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'blogId',
                        message: 'Blog id must be a string',
                    }
                ],
            });

            const data2 = {
                title: validPostFieldInput.title,
                shortDescription: validPostFieldInput.shortDescription,
                content: validPostFieldInput.content,
                blogId: '',
            };

            const response2 = await postTestManager.updatePost(postToUpdate.id, data2,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'blogId',
                        message: 'Blog id must not be empty',
                    }
                ],
            });

            const data3 = {
                title: validPostFieldInput.title,
                shortDescription: validPostFieldInput.shortDescription,
                content: validPostFieldInput.content,
                blogId: '  ',
            };

            const response3 = await postTestManager.updatePost(postToUpdate.id, data3,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'blogId',
                        message: 'Blog id must not be empty',
                    }
                ],
            });

            const data4 = {
                title: validPostFieldInput.title,
                shortDescription: validPostFieldInput.shortDescription,
                content: validPostFieldInput.content,
                blogId: '-100',
            };

            const response4 = await postTestManager.updatePost(postToUpdate.id, data4,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'blogId',
                        message: 'Blog id does not exist',
                    }
                ],
            });

            const dbPostToUpdate = await postsCollection
                .findOne({ id: postToUpdate.id }, { projection: { _id: 0 } });
            expect(dbPostToUpdate).toEqual(postToUpdate);
        });

        it(`shouldn't update post if multiple fields are invalid`, async () => {
            const postToUpdate = initialDbPosts[1];

            const data = {
                title: 'a'.repeat(31),
                shortDescription: '  ',
                blogId: '-100',
            };

            const response = await postTestManager.updatePost(postToUpdate.id, data,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response.body).toEqual({
                errorsMessages: expect.arrayContaining([
                    { field: 'title', message: 'Title length must be between 1 and 30 symbols' },
                    { field: 'shortDescription', message: 'Short description must not be empty' },
                    { field: 'content', message: 'Content is required' },
                    { field: 'blogId', message: 'Blog id does not exist' },
                ]),
            });

            const dbPostToUpdate = await postsCollection
                .findOne({ id: postToUpdate.id }, { projection: { _id: 0 } });
            expect(dbPostToUpdate).toEqual(postToUpdate);
        });

        // non-existing post
        it('should return 404 when updating non-existing post', async () => {
            const data: UpdatePostInputModel = {
                title: 'post 51',
                shortDescription: 'superpost 51',
                content: 'content of superpost 51',
                blogId: initialDbBlogs[0].id,
            }

            await postTestManager.updatePost('-100', data, HTTP_STATUSES.NOT_FOUND_404);

            // deleted
            const postToUpdate = initialDbPosts[2];
            await postTestManager.updatePost(postToUpdate.id, data, HTTP_STATUSES.NOT_FOUND_404);
        });

        // correct input
        it('should update post if input data is correct', async () => {
            const data: UpdatePostInputModel = {
                title: 'post 51',
                shortDescription: 'superpost 51',
                content: 'content of superpost 51',
                blogId: initialDbBlogs[0].id,
            };
            const postToUpdate = initialDbPosts[0];

            await postTestManager.updatePost(postToUpdate.id, data, HTTP_STATUSES.NO_CONTENT_204);

            // check other posts aren't modified
            const otherPosts = initialDbPosts.filter(b => b.id !== postToUpdate.id);
            for (const otherPost of otherPosts) {
                const dbOtherPost = await postsCollection
                    .findOne({ id: otherPost.id }, { projection: { _id: 0 } });
                expect(dbOtherPost).toEqual(otherPost);
            }
        });
    });
});