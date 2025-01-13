import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {HTTP_STATUSES} from "../../src/utils";
import {BlogDBType, PostDBType} from "../../src/types";
import {CreateBlogInputModel} from "../../src/features/blogs/models/CreateBlogInputModel";
import {blogTestManager} from "../test-managers/blog-test-manager";
import {websiteUrlPattern} from "../../src/validation/field-validators/blogs-field-validators";
import {blogsCollection, client, postsCollection, runDb, setDb} from "../../src/db/db";
import {MongoMemoryServer} from "mongodb-memory-server";
import {UpdateBlogInputModel} from "../../src/features/blogs/models/UpdateBlogInputModel";
import {invalidAuthValues} from "../datasets/authorization-data";
import {invalidUrls, validBlogFieldInput} from "../datasets/validation/blogs-validation-data";
import {blogsQueryRepository} from "../../src/features/blogs/repositories/blogs.query.repository";
import {createBlogsPaginator} from "../../src/features/blogs/blogs.controller";
import {DEFAULT_QUERY_VALUES} from "../../src/helpers/query-params-values";
import {invalidPageNumbers, invalidPageSizes} from "../datasets/validation/query-validation-data";
import {createPostsPaginator} from "../../src/features/posts/posts.controller";
import {validPostFieldInput} from "../datasets/validation/posts-validation-data";
import {CreateBlogPostInputModel} from "../../src/features/blogs/models/CreateBlogPostInputModel";

describe('tests for /blogs', () => {
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

    describe('get blogs', () => {
        let initialDbBlogs: BlogDBType[] = [];

        beforeAll(async () => {
            await setDb();
        });

        afterAll(async () => {
            await req
                .delete(SETTINGS.PATH.TESTING + '/all-data');
        });

        it('should return empty array', async () => {
            const expected = createBlogsPaginator(
                [],
                DEFAULT_QUERY_VALUES.BLOGS.pageNumber,
                DEFAULT_QUERY_VALUES.BLOGS.pageSize,
                0,
                0,
            );

            await req
                .get(SETTINGS.PATH.BLOGS)
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        it('should return array with all blogs', async () => {
            initialDbBlogs = [
                {
                    id: '1',
                    name: 'blog 1',
                    description: 'superblog 1',
                    websiteUrl: 'https://superblog.com/1',
                    isDeleted: true,
                    createdAt: '2024-12-16T05:32:26.882Z',
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
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '4',
                    name: 'blog 4',
                    description: 'superblog 4',
                    websiteUrl: 'https://superblog.com/4',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
            ];

            await setDb({ blogs: initialDbBlogs } );

            const expectedBlogs = initialDbBlogs.filter(b => !b.isDeleted);
            const expected = createBlogsPaginator(
                expectedBlogs,
                DEFAULT_QUERY_VALUES.BLOGS.pageNumber,
                DEFAULT_QUERY_VALUES.BLOGS.pageSize,
                1,
                expectedBlogs.length,
            );

            await req
                .get(SETTINGS.PATH.BLOGS)
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        it('should return blogs with name containing search name term', async () => {
            initialDbBlogs = [
                {
                    id: '1',
                    name: 'blog 1',
                    description: 'superblog 1',
                    websiteUrl: 'https://superblog.com/1',
                    isDeleted: true,
                    createdAt: '2024-12-17T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '2',
                    name: 'neblog 2',
                    description: 'superblog 2',
                    websiteUrl: 'https://superblog.com/2',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '3',
                    name: '3 neblog',
                    description: 'superblog 3',
                    websiteUrl: 'https://superblog.com/3',
                    isDeleted: true,
                    createdAt: '2024-12-15T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '4',
                    name: '4 neBlog',
                    description: 'superblog 4',
                    websiteUrl: 'https://superblog.com/4',
                    isDeleted: false,
                    createdAt: '2024-12-15T05:32:26.882Z',
                    isMembership: false,
                },
            ];
            await setDb({ blogs: initialDbBlogs } );

            const searchNameTerm = 'neblog';

            const expectedBlogs = [initialDbBlogs[1], initialDbBlogs[3]];
            const expected = createBlogsPaginator(
                expectedBlogs,
                DEFAULT_QUERY_VALUES.BLOGS.pageNumber,
                DEFAULT_QUERY_VALUES.BLOGS.pageSize,
                1,
                expectedBlogs.length,
            );

            await req
                .get(SETTINGS.PATH.BLOGS + '?searchNameTerm=' + searchNameTerm)
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // sorting
        // createdAt desc
        it('should return blogs sorted by creation date in desc order', async () => {
            initialDbBlogs = [
                {
                    id: '1',
                    name: 'a blog 1',
                    description: 'a superblog 1',
                    websiteUrl: 'https://asuperblog.com/1',
                    isDeleted: true,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '2',
                    name: 'b blog 2',
                    description: 'b superblog 2',
                    websiteUrl: 'https://bsuperblog.com/2',
                    isDeleted: false,
                    createdAt: '2024-12-17T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '3',
                    name: 'c neblog 3',
                    description: 'c superblog 3',
                    websiteUrl: 'https://csuperblog.com/3',
                    isDeleted: false,
                    createdAt: '2024-12-18T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '4',
                    name: 'a 4 neBlog',
                    description: 'a superblog 4',
                    websiteUrl: 'https://asuperblog.com/4',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
            ];

            await setDb({ blogs: initialDbBlogs });

            const expectedBlogs = [initialDbBlogs[2], initialDbBlogs[1], initialDbBlogs[3]];
            const expected = createBlogsPaginator(
                expectedBlogs,
                DEFAULT_QUERY_VALUES.BLOGS.pageNumber,
                DEFAULT_QUERY_VALUES.BLOGS.pageSize,
                1,
                expectedBlogs.length,
            );

            await req
                .get(SETTINGS.PATH.BLOGS + '?sortBy=createdAt&sortDirection=desc')
                .expect(HTTP_STATUSES.OK_200, expected);

            await req
                .get(SETTINGS.PATH.BLOGS + '?sortBy=createdAt')
                .expect(HTTP_STATUSES.OK_200, expected);

            await req
                .get(SETTINGS.PATH.BLOGS + '?sortDirection=desc')
                .expect(HTTP_STATUSES.OK_200, expected);

            await req
                .get(SETTINGS.PATH.BLOGS)
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // createdAt asc
        it('should return blogs sorted by creation date in asc order', async () => {
            const expectedBlogs = [initialDbBlogs[3], initialDbBlogs[1], initialDbBlogs[2]];
            const expected = createBlogsPaginator(
                expectedBlogs,
                DEFAULT_QUERY_VALUES.BLOGS.pageNumber,
                DEFAULT_QUERY_VALUES.BLOGS.pageSize,
                1,
                expectedBlogs.length,
            );

            await req
                .get(SETTINGS.PATH.BLOGS + '?sortBy=createdAt&sortDirection=asc')
                .expect(HTTP_STATUSES.OK_200, expected);

            await req
                .get(SETTINGS.PATH.BLOGS + '?sortDirection=asc')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // name desc
        it('should return blogs sorted by name in desc order', async () => {
            const expectedBlogs = [initialDbBlogs[2], initialDbBlogs[1], initialDbBlogs[3]];
            const expected = createBlogsPaginator(
                expectedBlogs,
                DEFAULT_QUERY_VALUES.BLOGS.pageNumber,
                DEFAULT_QUERY_VALUES.BLOGS.pageSize,
                1,
                expectedBlogs.length,
            );

            await req
                .get(SETTINGS.PATH.BLOGS + '?sortBy=name&sortDirection=desc')
                .expect(HTTP_STATUSES.OK_200, expected);

            await req
                .get(SETTINGS.PATH.BLOGS + '?sortBy=name')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // name asc
        it('should return blogs sorted by name in asc order', async () => {
            const expectedBlogs = [initialDbBlogs[3], initialDbBlogs[1], initialDbBlogs[2]];
            const expected = createBlogsPaginator(
                expectedBlogs,
                DEFAULT_QUERY_VALUES.BLOGS.pageNumber,
                DEFAULT_QUERY_VALUES.BLOGS.pageSize,
                1,
                expectedBlogs.length,
            );

            await req
                .get(SETTINGS.PATH.BLOGS + '?sortBy=name&sortDirection=asc')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // id desc
        it('should return blogs sorted by id in desc order', async () => {
            const expectedBlogs = [initialDbBlogs[3], initialDbBlogs[2], initialDbBlogs[1]];
            const expected = createBlogsPaginator(
                expectedBlogs,
                DEFAULT_QUERY_VALUES.BLOGS.pageNumber,
                DEFAULT_QUERY_VALUES.BLOGS.pageSize,
                1,
                expectedBlogs.length,
            );

            await req
                .get(SETTINGS.PATH.BLOGS + '?sortBy=id&sortDirection=desc')
                .expect(HTTP_STATUSES.OK_200, expected);

            await req
                .get(SETTINGS.PATH.BLOGS + '?sortBy=id')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // id asc
        it('should return blogs sorted by id in asc order', async () => {
            const expectedBlogs = [initialDbBlogs[1], initialDbBlogs[2], initialDbBlogs[3]];
            const expected = createBlogsPaginator(
                expectedBlogs,
                DEFAULT_QUERY_VALUES.BLOGS.pageNumber,
                DEFAULT_QUERY_VALUES.BLOGS.pageSize,
                1,
                expectedBlogs.length,
            );

            await req
                .get(SETTINGS.PATH.BLOGS + '?sortBy=id&sortDirection=asc')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // description desc
        it('should return blogs sorted by description in desc order', async () => {
            const expectedBlogs = [initialDbBlogs[2], initialDbBlogs[1], initialDbBlogs[3]];
            const expected = createBlogsPaginator(
                expectedBlogs,
                DEFAULT_QUERY_VALUES.BLOGS.pageNumber,
                DEFAULT_QUERY_VALUES.BLOGS.pageSize,
                1,
                expectedBlogs.length,
            );

            await req
                .get(SETTINGS.PATH.BLOGS + '?sortBy=description&sortDirection=desc')
                .expect(HTTP_STATUSES.OK_200, expected);

            await req
                .get(SETTINGS.PATH.BLOGS + '?sortBy=description')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // description asc
        it('should return blogs sorted by description in asc order', async () => {
            const expectedBlogs = [initialDbBlogs[3], initialDbBlogs[1], initialDbBlogs[2]];
            const expected = createBlogsPaginator(
                expectedBlogs,
                DEFAULT_QUERY_VALUES.BLOGS.pageNumber,
                DEFAULT_QUERY_VALUES.BLOGS.pageSize,
                1,
                expectedBlogs.length,
            );

            await req
                .get(SETTINGS.PATH.BLOGS + '?sortBy=description&sortDirection=asc')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // websiteUrl desc
        it('should return blogs sorted by websiteUrl in desc order', async () => {
            const expectedBlogs = [initialDbBlogs[2], initialDbBlogs[1], initialDbBlogs[3]];
            const expected = createBlogsPaginator(
                expectedBlogs,
                DEFAULT_QUERY_VALUES.BLOGS.pageNumber,
                DEFAULT_QUERY_VALUES.BLOGS.pageSize,
                1,
                expectedBlogs.length,
            );

            await req
                .get(SETTINGS.PATH.BLOGS + '?sortBy=websiteUrl&sortDirection=desc')
                .expect(HTTP_STATUSES.OK_200, expected);

            await req
                .get(SETTINGS.PATH.BLOGS + '?sortBy=websiteUrl')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // websiteUrl asc
        it('should return blogs sorted by websiteUrl in asc order', async () => {
            const expectedBlogs = [initialDbBlogs[3], initialDbBlogs[1], initialDbBlogs[2]];
            const expected = createBlogsPaginator(
                expectedBlogs,
                DEFAULT_QUERY_VALUES.BLOGS.pageNumber,
                DEFAULT_QUERY_VALUES.BLOGS.pageSize,
                1,
                expectedBlogs.length,
            );

            await req
                .get(SETTINGS.PATH.BLOGS + '?sortBy=websiteUrl&sortDirection=asc')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // sort + filter
        it('should return blogs with name containing search name term sorted by name in asc order',
            async () => {
            const searchNameTerm = 'neblog';

            const expectedBlogs = [initialDbBlogs[3], initialDbBlogs[2]];
                const expected = createBlogsPaginator(
                    expectedBlogs,
                    DEFAULT_QUERY_VALUES.BLOGS.pageNumber,
                    DEFAULT_QUERY_VALUES.BLOGS.pageSize,
                    1,
                    expectedBlogs.length,
                );

            await req
                .get(SETTINGS.PATH.BLOGS + '?sortBy=name&sortDirection=asc&searchNameTerm=' + searchNameTerm)
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // bad sort field
        it(`should return blogs in the order of creation if sort field doesn't exist`,
            async () => {
            const expectedBlogs = initialDbBlogs.slice(1);
            const expected = createBlogsPaginator(
                expectedBlogs,
                DEFAULT_QUERY_VALUES.BLOGS.pageNumber,
                DEFAULT_QUERY_VALUES.BLOGS.pageSize,
                1,
                expectedBlogs.length,
            );

            await req
                .get(SETTINGS.PATH.BLOGS + '?sortBy=bad')
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
                    createdAt: '2024-12-16T05:32:26.882Z',
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
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '4',
                    name: 'blog 4',
                    description: 'superblog 4',
                    websiteUrl: 'https://superblog.com/4',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '5',
                    name: 'blog 5',
                    description: 'superblog 5',
                    websiteUrl: 'https://superblog.com/5',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '6',
                    name: 'blog 6',
                    description: 'superblog 6',
                    websiteUrl: 'https://superblog.com/6',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '7',
                    name: 'blog 7',
                    description: 'superblog 7',
                    websiteUrl: 'https://superblog.com/7',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '8',
                    name: 'blog 8',
                    description: 'superblog 8',
                    websiteUrl: 'https://superblog.com/8',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '9',
                    name: 'blog 9',
                    description: 'superblog 9',
                    websiteUrl: 'https://superblog.com/9',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '10',
                    name: 'blog 10',
                    description: 'superblog 10',
                    websiteUrl: 'https://superblog.com/10',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '11',
                    name: 'blog 11',
                    description: 'superblog 11',
                    websiteUrl: 'https://superblog.com/11',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '12',
                    name: 'blog 12',
                    description: 'superblog 12',
                    websiteUrl: 'https://superblog.com/12',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '13',
                    name: 'blog 13',
                    description: 'superblog 13',
                    websiteUrl: 'https://superblog.com/13',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '14',
                    name: 'blog 14',
                    description: 'superblog 14',
                    websiteUrl: 'https://superblog.com/14',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '15',
                    name: 'blog 15',
                    description: 'superblog 15',
                    websiteUrl: 'https://superblog.com/15',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '16',
                    name: 'blog 16',
                    description: 'superblog 16',
                    websiteUrl: 'https://superblog.com/16',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '17',
                    name: 'blog 17',
                    description: 'superblog 17',
                    websiteUrl: 'https://superblog.com/17',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '18',
                    name: 'blog 18',
                    description: 'superblog 18',
                    websiteUrl: 'https://superblog.com/18',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '19',
                    name: 'blog 19',
                    description: 'superblog 19',
                    websiteUrl: 'https://superblog.com/19',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '20',
                    name: 'blog 20',
                    description: 'superblog 20',
                    websiteUrl: 'https://superblog.com/20',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '21',
                    name: 'blog 21',
                    description: 'superblog 21',
                    websiteUrl: 'https://superblog.com/21',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '22',
                    name: 'blog 22',
                    description: 'superblog 22',
                    websiteUrl: 'https://superblog.com/22',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '23',
                    name: 'blog 23',
                    description: 'superblog 23',
                    websiteUrl: 'https://superblog.com/23',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '24',
                    name: 'blog 24',
                    description: 'superblog 24',
                    websiteUrl: 'https://superblog.com/24',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
            ];

            await setDb({ blogs: initialDbBlogs });

            const expected = createBlogsPaginator(
                [], 0, 0, 0, 0,
            );
            for (const invalidPageNumber of invalidPageNumbers) {
                await req
                    .get(SETTINGS.PATH.BLOGS + '?pageNumber=' + invalidPageNumber)
                    .expect(HTTP_STATUSES.OK_200, expected);
            }
        });

        // invalid pageSize
        it('should return empty array if page size is invalid', async () => {
            const expected = createBlogsPaginator(
                [], 0, 0, 0, 0,
            );
            for (const invalidPageSize of invalidPageSizes) {
                await req
                    .get(SETTINGS.PATH.BLOGS + '?pageSize=' + invalidPageSize)
                    .expect(HTTP_STATUSES.OK_200, expected);
            }
        });

        // invalid both pageNumber and pageSize
        it('should return empty array if page number and page size are invalid',
            async () => {
            const invalidPageNumber = invalidPageNumbers[0];
            const invalidPageSize = invalidPageSizes[0];

            const expected = createBlogsPaginator(
                [], 0, 0, 0, 0,
            );

            await req
                .get(SETTINGS.PATH.BLOGS
                    + '?pageNumber=' + invalidPageNumber
                    + '&pageSize=' + invalidPageSize)
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // pageNumber* and pageSize defaults
        it('default page number and page size should be correct', async () => {
            const defaultPageSize = 10;
            const defaultPageNumber = 1;

            const expectedBlogs = initialDbBlogs.slice(0, defaultPageSize);
            const expected = createBlogsPaginator(
                expectedBlogs,
                defaultPageNumber,
                defaultPageSize,
                Math.ceil(initialDbBlogs.length / defaultPageSize),
                initialDbBlogs.length,
            );

            await req
                .get(SETTINGS.PATH.BLOGS)
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // non-default pageNumber
        it('should return correct part of blogs array if page number is non-default',
            async () => {
            const pageNumber = 2;
            const pageSize = DEFAULT_QUERY_VALUES.BLOGS.pageSize;

            const expectedBlogs = initialDbBlogs.slice(pageSize, 2 * pageSize);
            const expected = createBlogsPaginator(
                expectedBlogs,
                pageNumber,
                pageSize,
                Math.ceil(initialDbBlogs.length / pageSize),
                initialDbBlogs.length,
            );

            await req
                .get(SETTINGS.PATH.BLOGS + '?pageNumber=' + pageNumber)
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // non-default pageSize
        it('should return correct part of blogs array if page size is non-default',
            async () => {
            const pageSize = 15;

            const expectedBlogs = initialDbBlogs.slice(0, pageSize);
            const expected = createBlogsPaginator(
                expectedBlogs,
                DEFAULT_QUERY_VALUES.BLOGS.pageNumber,
                pageSize,
                Math.ceil(initialDbBlogs.length / pageSize),
                initialDbBlogs.length,
            );

            await req
                .get(SETTINGS.PATH.BLOGS + '?pageSize=' + pageSize)
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // non-default pageNumber and pageSize
        it('should return correct part of blogs array if page number and page size are non-default',
            async () => {
            const pageNumber = 3;
            const pageSize = 5;

            const expectedBlogs = initialDbBlogs.slice(
                (pageNumber - 1) * pageSize, pageNumber * pageSize
            );
            const expected = createBlogsPaginator(
                expectedBlogs,
                pageNumber,
                pageSize,
                Math.ceil(initialDbBlogs.length / pageSize),
                initialDbBlogs.length,
            );

            await req
                .get(SETTINGS.PATH.BLOGS
                    + '?pageNumber=' + pageNumber
                    + '&pageSize=' + pageSize)
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // pageNumber exceeds total number of pages
        it('should return empty array if page number exceeds total number of pages',
            async () => {
            const pageSize = DEFAULT_QUERY_VALUES.BLOGS.pageSize;
            const totalCount = initialDbBlogs.length;
            const pagesCount = Math.ceil(totalCount / pageSize);
            const pageNumber = pagesCount + 5;

            const expectedBlogs: BlogDBType[] = [];
            const expected = createBlogsPaginator(
                expectedBlogs,
                pageNumber,
                pageSize,
                pagesCount,
                totalCount,
            );

            await req
                .get(SETTINGS.PATH.BLOGS + '?pageNumber=' + pageNumber)
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // pageSize is greater than total number of items *
        it('should return all blogs if page size is greater than total number of blogs',
            async () => {
            const expectedBlogs = initialDbBlogs;
            const totalCount = initialDbBlogs.length;
            const pageSize = totalCount + 5;

            const expected = createBlogsPaginator(
                expectedBlogs,
                DEFAULT_QUERY_VALUES.BLOGS.pageNumber,
                pageSize,
                Math.ceil(totalCount / pageSize),
                totalCount,
            );

            await req
                .get(SETTINGS.PATH.BLOGS + '?pageSize=' + pageSize)
                .expect(HTTP_STATUSES.OK_200, expected);
        });
    });

    describe('get blog', () => {
        let initialDbBlogs: BlogDBType[];

        beforeAll(async () => {
            initialDbBlogs = [
                {
                    id: '1',
                    name: 'blog 1',
                    description: 'superblog 1',
                    websiteUrl: 'https://superblog.com/1',
                    isDeleted: true,
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
            await setDb({ blogs: initialDbBlogs } );
        });

        afterAll(async () => {
            await req
                .delete(SETTINGS.PATH.TESTING + '/all-data');
        });

        it('should return 404 for non-existing blog', async () => {
            await req
                .get(SETTINGS.PATH.BLOGS + '/-100')
                .expect(HTTP_STATUSES.NOT_FOUND_404);

            // deleted
            await req
                .get(SETTINGS.PATH.BLOGS + '/' + initialDbBlogs[0].id)
                .expect(HTTP_STATUSES.NOT_FOUND_404);
        });

        it('should return the second blog', async () => {
            const blogToGet = initialDbBlogs[1];

            await req
                .get(SETTINGS.PATH.BLOGS + '/' + blogToGet.id)
                .expect(HTTP_STATUSES.OK_200, blogsQueryRepository.mapToOutput(blogToGet));
        });
    });

    describe('delete blog', () => {
        let initialDbBlogs: BlogDBType[];
        let initialDbPosts: PostDBType[];

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

            await setDb({ blogs: initialDbBlogs, posts: initialDbPosts } );
        });

        afterAll(async () => {
            await req
                .delete(SETTINGS.PATH.TESTING + '/all-data');
        });

        it('should forbid deleting blogs for non-admin users', async () => {
            const blogToDelete = initialDbBlogs[0];

            // no auth
            await req
                .delete(SETTINGS.PATH.BLOGS + '/' + blogToDelete.id)
                .expect(HTTP_STATUSES.UNAUTHORIZED_401);

            for (const invalidAuthValue of invalidAuthValues) {
                await blogTestManager.deleteBlog(blogToDelete.id,
                    HTTP_STATUSES.UNAUTHORIZED_401, invalidAuthValue);
            }

            const dbBlogToDelete = await blogsCollection
                .findOne({ id: blogToDelete.id }, { projection: {_id: 0} });
            expect(dbBlogToDelete).toEqual(blogToDelete);

            const dbPosts = await postsCollection
                .find({ blogId: blogToDelete.id }, { projection: {_id: 0} }).toArray() as PostDBType[];
            const expectedPosts = initialDbPosts.filter(p => p.blogId === blogToDelete.id);
            expect(dbPosts).toEqual(expectedPosts);
        });

        it('should return 404 when deleting non-existing blog', async () => {
            await blogTestManager.deleteBlog('-100',
                HTTP_STATUSES.NOT_FOUND_404);

            // deleted
            const blogToDelete = initialDbBlogs[2];
            await blogTestManager.deleteBlog(blogToDelete.id,
                HTTP_STATUSES.NOT_FOUND_404);
        });

        it('should delete the first blog and all related posts', async () => {
            const blogToDelete = initialDbBlogs[0];

            await blogTestManager.deleteBlog(blogToDelete.id,
                HTTP_STATUSES.NO_CONTENT_204);

            const dbRelatedPosts = await postsCollection
                .find({ blogId: blogToDelete.id, isDeleted: false }).toArray();
            expect(dbRelatedPosts).toEqual([]);
        });
    });

    describe('create blog', () => {
        beforeAll(async () => {
            await setDb();
        });

        afterAll(async () => {
            await req
                .delete(SETTINGS.PATH.TESTING + '/all-data');
        });

        // authorization
        it('should forbid creating blogs for non-admin users', async () => {
            const data: CreateBlogInputModel = {
                name: validBlogFieldInput.name,
                description: validBlogFieldInput.description,
                websiteUrl: validBlogFieldInput.websiteUrl,
            }

            // no auth
            await req
                .post(SETTINGS.PATH.BLOGS)
                .send(data)
                .expect(HTTP_STATUSES.UNAUTHORIZED_401);

            for (const invalidAuthValue of invalidAuthValues) {
                await blogTestManager.createBlog(data, HTTP_STATUSES.UNAUTHORIZED_401,
                    invalidAuthValue);
            }

            expect(await blogsCollection.find({}).toArray()).toEqual([]);
        });

        // validation
        it(`shouldn't create blog if required fields are missing`, async () => {
            const data1 = {
                description: validBlogFieldInput.description,
                websiteUrl: validBlogFieldInput.websiteUrl,
            };

            const response1 = await blogTestManager.createBlog(data1,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'name',
                        message: 'Name is required',
                    }
                ],
            });

            const data2 = {
                name: validBlogFieldInput.name,
                websiteUrl: validBlogFieldInput.websiteUrl,
            };

            const response2 = await blogTestManager.createBlog(data2,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'description',
                        message: 'Description is required',
                    }
                ],
            });

            const data3 = {
                name: validBlogFieldInput.name,
                description: validBlogFieldInput.description,
            };

            const response3 = await blogTestManager.createBlog(data3,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'websiteUrl',
                        message: 'Website url is required',
                    }
                ],
            });

            expect(await blogsCollection.find({}).toArray()).toEqual([]);
        });

        it(`shouldn't create blog if name is invalid`, async () => {
            // not string
            const data1 = {
                name: 24,
                description: validBlogFieldInput.description,
                websiteUrl: validBlogFieldInput.websiteUrl,
            };

            const response1 = await blogTestManager.createBlog(data1,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'name',
                        message: 'Name must be a string',
                    }
                ],
            });

            // empty string
            const data2 = {
                name: '',
                description: validBlogFieldInput.websiteUrl,
                websiteUrl: validBlogFieldInput.websiteUrl,
            };

            const response2 = await blogTestManager.createBlog(data2,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'name',
                        message: 'Name must not be empty',
                    }
                ],
            });

            // empty string with spaces
            const data3 = {
                name: '  ',
                description: validBlogFieldInput.description,
                websiteUrl: validBlogFieldInput.websiteUrl,
            };

            const response3 = await blogTestManager.createBlog(data3,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'name',
                        message: 'Name must not be empty',
                    }
                ],
            });

            // long string
            const data4 = {
                name: 'a'.repeat(16),
                description: validBlogFieldInput.description,
                websiteUrl: validBlogFieldInput.websiteUrl,
            };

            const response4 = await blogTestManager.createBlog(data4,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'name',
                        message: 'Name length must be between 1 and 15 symbols',
                    }
                ],
            });

            expect(await blogsCollection.find({}).toArray()).toEqual([]);
        });

        it(`shouldn't create blog if description is invalid`, async () => {
            // not string
            const data1 = {
                name: validBlogFieldInput.name,
                description: 24,
                websiteUrl: validBlogFieldInput.websiteUrl,
            };

            const response1 = await blogTestManager.createBlog(data1,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'description',
                        message: 'Description must be a string',
                    }
                ],
            });

            // empty string
            const data2 = {
                name: validBlogFieldInput.name,
                description: '',
                websiteUrl: validBlogFieldInput.websiteUrl,
            };

            const response2 = await blogTestManager.createBlog(data2,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'description',
                        message: 'Description must not be empty',
                    }
                ],
            });

            // empty string with spaces
            const data3 = {
                name: validBlogFieldInput.name,
                description: '  ',
                websiteUrl: validBlogFieldInput.websiteUrl,
            };

            const response3 = await blogTestManager.createBlog(data3,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'description',
                        message: 'Description must not be empty',
                    }
                ],
            });

            // long string
            const data4 = {
                name: validBlogFieldInput.name,
                description: 'a'.repeat(501),
                websiteUrl: validBlogFieldInput.websiteUrl,
            };

            const response4 = await blogTestManager.createBlog(data4,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'description',
                        message: 'Description length must be between 1 and 500 symbols',
                    }
                ],
            });

            expect(await blogsCollection.find({}).toArray()).toEqual([]);
        });

        it(`shouldn't create blog if website url is invalid`, async () => {
            // not string
            const data1 = {
                name: validBlogFieldInput.name,
                description: validBlogFieldInput.description,
                websiteUrl: 24,
            };

            const response1 = await blogTestManager.createBlog(data1,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'websiteUrl',
                        message: 'Website url must be a string',
                    }
                ],
            });

            // empty string
            const data2 = {
                name: validBlogFieldInput.name,
                description: validBlogFieldInput.description,
                websiteUrl: '',
            };

            const response2 = await blogTestManager.createBlog(data2,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'websiteUrl',
                        message: 'Website url must not be empty',
                    }
                ],
            });

            // empty string with spaces
            const data3 = {
                name: validBlogFieldInput.name,
                description: validBlogFieldInput.description,
                websiteUrl: '  ',
            };

            const response3 = await blogTestManager.createBlog(data3,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'websiteUrl',
                        message: 'Website url must not be empty',
                    }
                ],
            });

            // long string
            const data4 = {
                name: validBlogFieldInput.name,
                description: validBlogFieldInput.description,
                websiteUrl: 'a'.repeat(101),
            };

            const response4 = await blogTestManager.createBlog(data4,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'websiteUrl',
                        message: 'Website url length must be between 1 and 100 symbols',
                    }
                ],
            });

            // invalid url
            const invalidUrlData = [];
            for (const invalidUrl of invalidUrls) {
                const dataItem = {
                    name: validBlogFieldInput.name,
                    description: validBlogFieldInput.description,
                    websiteUrl: invalidUrl,
                }
                invalidUrlData.push(dataItem);
            }

            for (const dataItem of invalidUrlData) {
                const response = await blogTestManager.createBlog(dataItem,
                    HTTP_STATUSES.BAD_REQUEST_400);
                expect(response.body).toEqual({
                    errorsMessages: [
                        {
                            field: 'websiteUrl',
                            message: 'Website url must match the following pattern: ' + websiteUrlPattern,
                        }
                    ],
                });
            }

            expect(await blogsCollection.find({}).toArray()).toEqual([]);
        });

        it(`shouldn't create blog if multiple fields are invalid`, async () => {
            const data = {
                name: 'a'.repeat(20),
                description: '  ',
            };

            const createResponse = await blogTestManager.createBlog(data,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(createResponse.body).toEqual({
                errorsMessages: expect.arrayContaining([
                    { message: expect.any(String), field: 'name' },
                    { message: expect.any(String), field: 'description' },
                    { message: expect.any(String), field: 'websiteUrl' },
                ]),
            });

            expect(await blogsCollection.find({}).toArray()).toEqual([]);
        });

        // correct input
        it('should create blog if input data is correct', async () => {
            const data: CreateBlogInputModel = {
                name: 'blog 1',
                description: 'superblog 1',
                websiteUrl: 'https://superblog.com/1',
            };

            await blogTestManager
                .createBlog(data, HTTP_STATUSES.CREATED_201);

            const dbBlogs = await blogsCollection.find({}).toArray();
            expect(dbBlogs.length).toBe(1);
        });

        it('should create one more blog', async () => {
            const data: CreateBlogInputModel = {
                name: 'blog 2',
                description: 'superblog 2',
                websiteUrl: 'https://superblog.com/2',
            };

            await blogTestManager
                .createBlog(data, HTTP_STATUSES.CREATED_201);

            const dbBlogs = await blogsCollection.find({}).toArray();
            expect(dbBlogs.length).toBe(2);
        });
    });

    describe('update blog', () => {
        let initialDbBlogs: BlogDBType[];
        let initialDbPosts: PostDBType[] = [];

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

            await setDb({ blogs: initialDbBlogs, posts: initialDbPosts } );
        });

        afterAll(async () => {
            await req
                .delete(SETTINGS.PATH.TESTING + '/all-data');
        });

        // authorization
        it('should forbid updating blogs for non-admin users', async () => {
            const data: UpdateBlogInputModel = {
                name: 'blog 51',
                description: 'superblog 51',
                websiteUrl: 'https://superblog.com/51',
            };
            const blogToUpdate = initialDbBlogs[0];

            // no auth
            await req
                .put(SETTINGS.PATH.BLOGS + '/' + blogToUpdate.id)
                .send(data)
                .expect(HTTP_STATUSES.UNAUTHORIZED_401);

            for (const invalidAuthValue of invalidAuthValues) {
                await blogTestManager.updateBlog(blogToUpdate.id, data,
                    HTTP_STATUSES.UNAUTHORIZED_401, invalidAuthValue);
            }

            const dbBlogToUpdate = await blogsCollection
                .findOne({ id: blogToUpdate.id }, { projection: { _id: 0 } });
            expect(dbBlogToUpdate).toEqual(blogToUpdate);
        });

        // validation
        it(`shouldn't update blog if required fields are missing`, async () => {
            const blogToUpdate = initialDbBlogs[0];

            const data1 = {
                description: validBlogFieldInput.description,
                websiteUrl: validBlogFieldInput.websiteUrl,
            };

            const response1 = await blogTestManager.updateBlog(blogToUpdate.id, data1,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'name',
                        message: 'Name is required',
                    }
                ],
            });

            const data2 = {
                name: validBlogFieldInput.name,
                websiteUrl: validBlogFieldInput.websiteUrl,
            };

            const response2 = await blogTestManager.updateBlog(blogToUpdate.id, data2,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'description',
                        message: 'Description is required',
                    }
                ],
            });

            const data3 = {
                name: validBlogFieldInput.name,
                description: validBlogFieldInput.description,
            };

            const response3 = await blogTestManager.updateBlog(blogToUpdate.id, data3,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'websiteUrl',
                        message: 'Website url is required',
                    }
                ],
            });

            const dbBlogToUpdate = await blogsCollection
                .findOne({ id: blogToUpdate.id }, { projection: { _id: 0 } });
            expect(dbBlogToUpdate).toEqual(blogToUpdate);
        });

        it(`shouldn't update blog if name is invalid`, async () => {
            const blogToUpdate = initialDbBlogs[0];

            // not string
            const data1 = {
                name: 24,
                description: validBlogFieldInput.description,
                websiteUrl: validBlogFieldInput.websiteUrl,
            };

            const response1 = await blogTestManager.updateBlog(blogToUpdate.id, data1,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'name',
                        message: 'Name must be a string',
                    }
                ],
            });

            // empty string
            const data2 = {
                name: '',
                description: validBlogFieldInput.description,
                websiteUrl: validBlogFieldInput.websiteUrl,
            };

            const response2 = await blogTestManager.updateBlog(blogToUpdate.id, data2,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'name',
                        message: 'Name must not be empty',
                    }
                ],
            });

            // empty string with spaces
            const data3 = {
                name: '  ',
                description: validBlogFieldInput.description,
                websiteUrl: validBlogFieldInput.websiteUrl,
            };

            const response3 = await blogTestManager.updateBlog(blogToUpdate.id, data3,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'name',
                        message: 'Name must not be empty',
                    }
                ],
            });

            // long string
            const data4 = {
                name: 'a'.repeat(16),
                description: validBlogFieldInput.description,
                websiteUrl: validBlogFieldInput.websiteUrl,
            };

            const response4 = await blogTestManager.updateBlog(blogToUpdate.id, data4,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'name',
                        message: 'Name length must be between 1 and 15 symbols',
                    }
                ],
            });

            const dbBlogToUpdate = await blogsCollection
                .findOne({ id: blogToUpdate.id }, { projection: { _id: 0 } });
            expect(dbBlogToUpdate).toEqual(blogToUpdate);
        });

        it(`shouldn't update blog if description is invalid`, async () => {
            const blogToUpdate = initialDbBlogs[0];

            // not string
            const data1 = {
                name: validBlogFieldInput.name,
                description: 24,
                websiteUrl: validBlogFieldInput.websiteUrl,
            };

            const response1 = await blogTestManager.updateBlog(blogToUpdate.id, data1,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'description',
                        message: 'Description must be a string',
                    }
                ],
            });

            // empty string
            const data2 = {
                name: validBlogFieldInput.name,
                description: '',
                websiteUrl: validBlogFieldInput.websiteUrl,
            };

            const response2 = await blogTestManager.updateBlog(blogToUpdate.id, data2,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'description',
                        message: 'Description must not be empty',
                    }
                ],
            });

            // empty string with spaces
            const data3 = {
                name: validBlogFieldInput.name,
                description: '  ',
                websiteUrl: validBlogFieldInput.websiteUrl,
            };

            const response3 = await blogTestManager.updateBlog(blogToUpdate.id, data3,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'description',
                        message: 'Description must not be empty',
                    }
                ],
            });

            // long string
            const data4 = {
                name: validBlogFieldInput.name,
                description: 'a'.repeat(501),
                websiteUrl: validBlogFieldInput.websiteUrl,
            };

            const response4 = await blogTestManager.updateBlog(blogToUpdate.id, data4,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'description',
                        message: 'Description length must be between 1 and 500 symbols',
                    }
                ],
            });

            const dbBlogToUpdate = await blogsCollection
                .findOne({ id: blogToUpdate.id }, { projection: { _id: 0 } });
            expect(dbBlogToUpdate).toEqual(blogToUpdate);
        });

        it(`shouldn't update blog if website url is invalid`, async () => {
            const blogToUpdate = initialDbBlogs[0];

            // not string
            const data1 = {
                name: validBlogFieldInput.name,
                description: validBlogFieldInput.description,
                websiteUrl: 24,
            };

            const response1 = await blogTestManager.updateBlog(blogToUpdate.id, data1,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'websiteUrl',
                        message: 'Website url must be a string',
                    }
                ],
            });

            // empty string
            const data2 = {
                name: validBlogFieldInput.name,
                description: validBlogFieldInput.description,
                websiteUrl: '',
            };

            const response2 = await blogTestManager.updateBlog(blogToUpdate.id, data2,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'websiteUrl',
                        message: 'Website url must not be empty',
                    }
                ],
            });

            // empty string with spaces
            const data3 = {
                name: validBlogFieldInput.name,
                description: validBlogFieldInput.description,
                websiteUrl: '  ',
            };

            const response3 = await blogTestManager.updateBlog(blogToUpdate.id, data3,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'websiteUrl',
                        message: 'Website url must not be empty',
                    }
                ],
            });

            // long string
            const data4 = {
                name: validBlogFieldInput.name,
                description: validBlogFieldInput.description,
                websiteUrl: 'a'.repeat(101),
            };

            const response4 = await blogTestManager.updateBlog(blogToUpdate.id, data4,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'websiteUrl',
                        message: 'Website url length must be between 1 and 100 symbols',
                    }
                ],
            });

            // invalid url
            const invalidUrlData = [];
            for (const invalidUrl of invalidUrls) {
                const dataItem = {
                    name: validBlogFieldInput.name,
                    description: validBlogFieldInput.description,
                    websiteUrl: invalidUrl,
                }
                invalidUrlData.push(dataItem);
            }

            for (const dataItem of invalidUrlData) {
                const response = await blogTestManager.updateBlog(blogToUpdate.id, dataItem,
                    HTTP_STATUSES.BAD_REQUEST_400);
                expect(response.body).toEqual({
                    errorsMessages: [
                        {
                            field: 'websiteUrl',
                            message: 'Website url must match the following pattern: ' + websiteUrlPattern,
                        }
                    ],
                });
            }

            const dbBlogToUpdate = await blogsCollection
                .findOne({ id: blogToUpdate.id }, { projection: { _id: 0 } });
            expect(dbBlogToUpdate).toEqual(blogToUpdate);
        });

        it(`shouldn't update blog if multiple fields are invalid`, async () => {
            const blogToUpdate = initialDbBlogs[0];

            const data = {
                name: 'a'.repeat(20),
                description: '  ',
            };

            const createResponse = await blogTestManager.updateBlog(blogToUpdate.id, data,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(createResponse.body).toEqual({
                errorsMessages: expect.arrayContaining([
                    { message: expect.any(String), field: 'name' },
                    { message: expect.any(String), field: 'description' },
                    { message: expect.any(String), field: 'websiteUrl' },
                ]),
            });

            const dbBlogToUpdate = await blogsCollection
                .findOne({ id: blogToUpdate.id }, { projection: { _id: 0 } });
            expect(dbBlogToUpdate).toEqual(blogToUpdate);
        });

        // non-existing blog
        it('should return 404 when updating non-existing blog', async () => {
            const data: UpdateBlogInputModel = {
                name: 'blog 51',
                description: 'superblog 51',
                websiteUrl: 'https://superblog.com/51',
            };

            await blogTestManager.updateBlog('-100', data, HTTP_STATUSES.NOT_FOUND_404);

            // deleted
            const blogToUpdate = initialDbBlogs[2];
            await blogTestManager.updateBlog(blogToUpdate.id, data, HTTP_STATUSES.NOT_FOUND_404);
        });

        // correct input
        it('should update blog if input data is correct', async () => {
            const data: UpdateBlogInputModel = {
                name: 'blog 51',
                description: 'superblog 51',
                websiteUrl: 'https://superblog.com/51',
            };
            const blogToUpdate = initialDbBlogs[0];

            await blogTestManager.updateBlog(blogToUpdate.id, data, HTTP_STATUSES.NO_CONTENT_204);

            // check other blogs aren't modified
            const otherBlogs = initialDbBlogs.filter(b => b.id !== blogToUpdate.id);
            for (const otherBlog of otherBlogs) {
                const dbOtherBlog = await blogsCollection
                    .findOne({ id: otherBlog.id }, { projection: { _id: 0 } });
                expect(dbOtherBlog).toEqual(otherBlog);
            }
        });

        // related posts' blogName changes after blog's name is updated
        it(`should update blogName of all related posts after blog's name is updated`,
            async () => {
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
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: true,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '2',
                    title: 'post 2',
                    shortDescription: 'superpost 2',
                    content: 'content of superpost 2',
                    blogId: '2',
                    blogName: 'blog 2',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '3',
                    title: 'post 3',
                    shortDescription: 'superpost 3',
                    content: 'content of superpost 3',
                    blogId: '2',
                    blogName: 'blog 2',
                    isDeleted: true,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '4',
                    title: 'post 4',
                    shortDescription: 'superpost 4',
                    content: 'content of superpost 4',
                    blogId: '2',
                    blogName: 'blog 2',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
            ];

            await setDb({ blogs: initialDbBlogs, posts: initialDbPosts });

            const newBlogName = 'new blog name';
            const blogToUpdate = initialDbBlogs[0];
            const data: UpdateBlogInputModel = {
                name: newBlogName,
                description: blogToUpdate.description,
                websiteUrl: blogToUpdate.websiteUrl,
            };

            await blogTestManager.updateBlog(blogToUpdate.id, data, HTTP_STATUSES.NO_CONTENT_204);

            const dbRelatedPosts = await postsCollection
                .find({ blogId: blogToUpdate.id, isDeleted: false }, { projection: { _id: 0 } })
                .toArray() as PostDBType[];
            for (const dbRelatedPost of dbRelatedPosts) {
                expect(dbRelatedPost.blogName).toBe(newBlogName);
            }
        });
    });

    describe('get blog posts', () => {
        let initialDbBlogs: BlogDBType[] = [
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
        let initialDbPosts: PostDBType[] = [];

        beforeAll(async () => {
            await setDb({ blogs: initialDbBlogs, posts: initialDbPosts });
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
                .get(SETTINGS.PATH.BLOGS + '/' + initialDbBlogs[0].id + '/posts')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        it('should return 404 for posts of non-existing blog', async () => {
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
                    blogId: '3',
                    blogName: 'blog 3',
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

            await setDb({ posts: initialDbPosts });

            await req
                .get(SETTINGS.PATH.BLOGS + '/-100/posts')
                .expect(HTTP_STATUSES.NOT_FOUND_404);

            // deleted blog
            await req
                .get(SETTINGS.PATH.BLOGS + '/' + initialDbBlogs[2].id + '/posts')
                .expect(HTTP_STATUSES.NOT_FOUND_404);
        });

        it('should return all posts of blog', async () => {
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

            await setDb({ posts: initialDbPosts });

            const blogId = initialDbBlogs[0].id;
            const expectedPosts = initialDbPosts
                .filter(p => !p.isDeleted && p.blogId === blogId);
            const expected = await createPostsPaginator(
                expectedPosts,
                DEFAULT_QUERY_VALUES.POSTS.pageNumber,
                DEFAULT_QUERY_VALUES.POSTS.pageSize,
                1,
                expectedPosts.length,
            );

            await req
                .get(SETTINGS.PATH.BLOGS + '/' + blogId + '/posts')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // sorting
        // createdAt desc
        it('should return posts of blog sorted by creation date in desc order', async () => {
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
                    createdAt: '2024-12-17T05:32:26.882Z',
                },
                {
                    id: '3',
                    title: 'post 3',
                    shortDescription: 'superpost 3',
                    content: 'content of superpost 3',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-18T05:32:26.882Z',
                },
                {
                    id: '4',
                    title: 'post 4',
                    shortDescription: 'superpost 4',
                    content: 'content of superpost 4',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-15T05:32:26.882Z',
                },
                {
                    id: '5',
                    title: 'post 5',
                    shortDescription: 'superpost 5',
                    content: 'content of superpost 5',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: true,
                    createdAt: '2024-12-15T05:32:26.882Z',
                },
            ];

            await setDb({ posts: initialDbPosts });

            const expectedPosts = [initialDbPosts[2], initialDbPosts[1], initialDbPosts[3]];
            const expected = await createPostsPaginator(
                expectedPosts,
                DEFAULT_QUERY_VALUES.POSTS.pageNumber,
                DEFAULT_QUERY_VALUES.POSTS.pageSize,
                1,
                expectedPosts.length,
            );

            const blogId = initialDbBlogs[0].id;

            await req
                .get(SETTINGS.PATH.BLOGS + '/' + blogId + '/posts'
                    + '?sortBy=createdAt&sortDirection=desc')
                .expect(HTTP_STATUSES.OK_200, expected);

            await req
                .get(SETTINGS.PATH.BLOGS + '/' + blogId + '/posts'
                    + '?sortBy=createdAt')
                .expect(HTTP_STATUSES.OK_200, expected);

            await req
                .get(SETTINGS.PATH.BLOGS + '/' + blogId + '/posts'
                    + '?sortDirection=desc')
                .expect(HTTP_STATUSES.OK_200, expected);

            await req
                .get(SETTINGS.PATH.BLOGS + '/' + blogId + '/posts')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // createdAt asc
        it('should return posts of blog sorted by creation date in asc order', async () => {
            const expectedPosts = [initialDbPosts[3], initialDbPosts[1], initialDbPosts[2]];
            const expected = await createPostsPaginator(
                expectedPosts,
                DEFAULT_QUERY_VALUES.POSTS.pageNumber,
                DEFAULT_QUERY_VALUES.POSTS.pageSize,
                1,
                expectedPosts.length,
            );

            const blogId = initialDbBlogs[0].id;

            await req
                .get(SETTINGS.PATH.BLOGS + '/' + blogId + '/posts'
                    + '?sortBy=createdAt&sortDirection=asc')
                .expect(HTTP_STATUSES.OK_200, expected);
            await req
                .get(SETTINGS.PATH.BLOGS + '/' + blogId + '/posts'
                    + '?sortDirection=asc')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // bad sort field
        it(`should return posts of blog ordered by _id if sort field doesn't exist`,
            async () => {
            const blogId = initialDbBlogs[0].id;

            const expectedPosts = initialDbPosts
                .filter(p => !p.isDeleted && p.blogId === blogId);
            const expected = await createPostsPaginator(
                expectedPosts,
                DEFAULT_QUERY_VALUES.POSTS.pageNumber,
                DEFAULT_QUERY_VALUES.POSTS.pageSize,
                1,
                expectedPosts.length,
            );

            await req
                .get(SETTINGS.PATH.BLOGS + '/' + blogId + '/posts'
                    + '?sortBy=bad')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // pagination
        // invalid pageNumber
        it('should return empty array if page number is invalid', async () => {
            // no deleted posts
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
                {
                    id: '25',
                    title: 'post 25',
                    shortDescription: 'superpost 25',
                    content: 'content of superpost 25',
                    blogId: '2',
                    blogName: 'blog 2',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '26',
                    title: 'post 26',
                    shortDescription: 'superpost 26',
                    content: 'content of superpost 26',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '27',
                    title: 'post 27',
                    shortDescription: 'superpost 27',
                    content: 'content of superpost 27',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '28',
                    title: 'post 28',
                    shortDescription: 'superpost 28',
                    content: 'content of superpost 28',
                    blogId: '1',
                    blogName: 'blog 1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
            ];

            await setDb({ posts: initialDbPosts });

            for (const invalidPageNumber of invalidPageNumbers) {
                const expected = await createPostsPaginator(
                    [], 0, 0, 0, 0,
                );

                await req
                    .get(SETTINGS.PATH.BLOGS + '/' + initialDbBlogs[0].id + '/posts'
                        + '?pageNumber=' + invalidPageNumber)
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
                    .get(SETTINGS.PATH.BLOGS + '/' + initialDbBlogs[0].id + '/posts'
                        + '?pageSize=' + invalidPageSize)
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
                    .get(SETTINGS.PATH.BLOGS + '/' + initialDbBlogs[0].id + '/posts'
                        + '?pageNumber=' + invalidPageNumber
                        + '&pageSize=' + invalidPageSize)
                    .expect(HTTP_STATUSES.OK_200, expected);
            });

        // pageNumber* and pageSize defaults
        it('default page number and page size should be correct', async () => {
            const defaultPageSize = 10;
            const defaultPageNumber = 1;

            const blogId = initialDbBlogs[0].id;
            const postsOfBlog = initialDbPosts.filter(p => p.blogId === blogId);

            const expectedPosts = postsOfBlog.slice(0, defaultPageSize);
            const expected = await createPostsPaginator(
                expectedPosts,
                defaultPageNumber,
                defaultPageSize,
                Math.ceil(postsOfBlog.length / defaultPageSize),
                postsOfBlog.length,
            );

            await req
                .get(SETTINGS.PATH.BLOGS + '/' + blogId + '/posts')
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // non-default pageNumber
        it('should return correct part of posts array if page number is non-default',
            async () => {
                const pageNumber = 2;

                const blogId = initialDbBlogs[0].id;
                const postsOfBlog = initialDbPosts.filter(p => p.blogId === blogId);

                const expectedPosts = postsOfBlog.slice(10, 20);
                const expected = await createPostsPaginator(
                    expectedPosts,
                    pageNumber,
                    DEFAULT_QUERY_VALUES.POSTS.pageSize,
                    Math.ceil(postsOfBlog.length / DEFAULT_QUERY_VALUES.POSTS.pageSize),
                    postsOfBlog.length,
                );

                await req
                    .get(SETTINGS.PATH.BLOGS + '/' + blogId + '/posts'
                        + '?pageNumber=' + pageNumber)
                    .expect(HTTP_STATUSES.OK_200, expected);
            });

        // non-default pageSize
        it('should return correct part of posts array if page size is non-default',
            async () => {
                const pageSize = 15;

                const blogId = initialDbBlogs[0].id;
                const postsOfBlog = initialDbPosts.filter(p => p.blogId === blogId);

                const expectedPosts = postsOfBlog.slice(0, pageSize);
                const expected = await createPostsPaginator(
                    expectedPosts,
                    DEFAULT_QUERY_VALUES.POSTS.pageNumber,
                    pageSize,
                    Math.ceil(postsOfBlog.length / pageSize),
                    postsOfBlog.length,
                );

                await req
                    .get(SETTINGS.PATH.BLOGS + '/' + blogId + '/posts'
                        + '?pageSize=' + pageSize)
                    .expect(HTTP_STATUSES.OK_200, expected);
            });

        // non-default pageNumber and pageSize
        it('should return correct part of posts array if page number and page size are non-default',
            async () => {
                const pageNumber = 3;
                const pageSize = 5;

                const blogId = initialDbBlogs[0].id;
                const postsOfBlog = initialDbPosts.filter(p => p.blogId === blogId);

                const expectedPosts = postsOfBlog.slice((pageNumber - 1) * pageSize,
                    (pageNumber - 1) * pageSize + pageSize);
                const expected = await createPostsPaginator(
                    expectedPosts,
                    pageNumber,
                    pageSize,
                    Math.ceil(postsOfBlog.length / pageSize),
                    postsOfBlog.length,
                );

                await req
                    .get(SETTINGS.PATH.BLOGS + '/' + blogId + '/posts'
                        + '?pageNumber=' + pageNumber
                        + '&pageSize=' + pageSize)
                    .expect(HTTP_STATUSES.OK_200, expected);
            });

        // pageNumber exceeds total number of pages
        it('should return empty array if page number exceeds total number of pages',
            async () => {
                const blogId = initialDbBlogs[0].id;
                const postsOfBlog = initialDbPosts.filter(p => p.blogId === blogId);

                const pagesCount = Math.ceil(postsOfBlog.length / DEFAULT_QUERY_VALUES.POSTS.pageSize);
                const pageNumber = pagesCount + 5;

                const expectedPosts: PostDBType[] = [];
                const expected = await createPostsPaginator(
                    expectedPosts,
                    pageNumber,
                    DEFAULT_QUERY_VALUES.POSTS.pageSize,
                    pagesCount,
                    postsOfBlog.length,
                );

                await req
                    .get(SETTINGS.PATH.BLOGS + '/' + blogId + '/posts'
                        + '?pageNumber=' + pageNumber)
                    .expect(HTTP_STATUSES.OK_200, expected);
            });

        // pageSize is greater than total number of items *
        it('should return all posts if page size is greater than total number of items',
            async () => {
                const blogId = initialDbBlogs[0].id;
                const postsOfBlog = initialDbPosts.filter(p => p.blogId === blogId);

                const pageSize = postsOfBlog.length + 10;

                const expected = await createPostsPaginator(
                    postsOfBlog,
                    DEFAULT_QUERY_VALUES.POSTS.pageNumber,
                    pageSize,
                    Math.ceil(postsOfBlog.length / pageSize),
                    postsOfBlog.length,
                );

                await req
                    .get(SETTINGS.PATH.BLOGS + '/' + blogId + '/posts'
                        + '?pageSize=' + pageSize)
                    .expect(HTTP_STATUSES.OK_200, expected);
            });
    });

    describe('create blog post', () => {
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
            const data: CreateBlogPostInputModel = {
                title: validPostFieldInput.title,
                shortDescription: validPostFieldInput.shortDescription,
                content: validPostFieldInput.content,
            };

            const blogId = validBlogIdInput;

            // no auth
            await req
                .post(SETTINGS.PATH.BLOGS + '/' + blogId + '/posts')
                .send(data)
                .expect(HTTP_STATUSES.UNAUTHORIZED_401);

            for (const invalidAuthValue of invalidAuthValues) {
                await blogTestManager.createBlogPost(blogId, data,
                    HTTP_STATUSES.UNAUTHORIZED_401, invalidAuthValue);
            }

            expect(await postsCollection.find({}).toArray()).toEqual([]);
        });

        // validation
        it(`shouldn't create post of non-existing blog`, async () => {
            const data: CreateBlogPostInputModel = {
                title: validPostFieldInput.title,
                shortDescription: validPostFieldInput.shortDescription,
                content: validPostFieldInput.content,
            };

            await blogTestManager.createBlogPost('-100', data,
                HTTP_STATUSES.NOT_FOUND_404);

            // deleted
            await blogTestManager.createBlogPost(initialDbBlogs[2].id, data,
                HTTP_STATUSES.NOT_FOUND_404);
        });

        it(`shouldn't create post if required fields are missing`, async () => {
            const blogId = validBlogIdInput;

            const data1 = {
                shortDescription: validPostFieldInput.shortDescription,
                content: validPostFieldInput.content,
            };

            const response1 = await blogTestManager.createBlogPost(blogId, data1,
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
            };

            const response2 = await blogTestManager.createBlogPost(blogId, data2,
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
            };

            const response3 = await blogTestManager.createBlogPost(blogId, data3,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'content',
                        message: 'Content is required',
                    }
                ],
            });

            expect(await postsCollection.find({}).toArray()).toEqual([]);
        });

        it(`shouldn't create post if title is invalid`, async () => {
            const blogId = validBlogIdInput;

            const data1 = {
                title: 24,
                shortDescription: validPostFieldInput.shortDescription,
                content: validPostFieldInput.content,
            };

            const response1 = await blogTestManager.createBlogPost(blogId, data1,
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
            };

            const response2 = await blogTestManager.createBlogPost(blogId, data2,
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
            };

            const response3 = await blogTestManager.createBlogPost(blogId, data3,
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
            };

            const response4 = await blogTestManager.createBlogPost(blogId, data4,
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
            const blogId = validBlogIdInput;

            const data1 = {
                title: validPostFieldInput.title,
                shortDescription: 24,
                content: validPostFieldInput.content,
            };

            const response1 = await blogTestManager.createBlogPost(blogId, data1,
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
            };

            const response2 = await blogTestManager.createBlogPost(blogId, data2,
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
            };

            const response3 = await blogTestManager.createBlogPost(blogId, data3,
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
            };

            const response4 = await blogTestManager.createBlogPost(blogId, data4,
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
            const blogId = validBlogIdInput;

            const data1 = {
                title: validPostFieldInput.title,
                shortDescription: validPostFieldInput.shortDescription,
                content: 24,
            };

            const response1 = await blogTestManager.createBlogPost(blogId, data1,
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
            };

            const response2 = await blogTestManager.createBlogPost(blogId, data2,
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
            };

            const response3 = await blogTestManager.createBlogPost(blogId, data3,
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
            };

            const response4 = await blogTestManager.createBlogPost(blogId, data4,
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

        it(`shouldn't create post if multiple fields are invalid`, async () => {
            const blogId = validBlogIdInput;

            const data = {
                title: 'a'.repeat(31),
                shortDescription: '  ',
            };

            const response = await blogTestManager.createBlogPost(blogId, data,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response.body).toEqual({
                errorsMessages: expect.arrayContaining([
                    { field: 'title', message: 'Title length must be between 1 and 30 symbols' },
                    { field: 'shortDescription', message: 'Short description must not be empty' },
                    { field: 'content', message: 'Content is required' },
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

            const createPostData: CreateBlogPostInputModel = {
                title: 'post 1',
                shortDescription: 'superpost 1',
                content: 'content of superpost 1',
            };

            await blogTestManager.createBlogPost(createdBlog.id, createPostData,
                HTTP_STATUSES.CREATED_201);

            const dbPosts = await postsCollection.find({}).toArray();
            expect(dbPosts.length).toBe(1);
        });

        it('should create one more post', async () => {
            const createPostData: CreateBlogPostInputModel = {
                title: 'post 2',
                shortDescription: 'superpost 2',
                content: 'content of superpost 2',
            };

            const blogId = initialDbBlogs[0].id;

            await blogTestManager.createBlogPost(blogId, createPostData,
                HTTP_STATUSES.CREATED_201);

            const dbPosts = await postsCollection.find({}).toArray();
            expect(dbPosts.length).toBe(2);
        });
    });
});