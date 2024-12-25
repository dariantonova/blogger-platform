import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {HTTP_STATUSES} from "../../src/utils";
import {BlogDBType, PostDBType} from "../../src/types";
import {CreateBlogInputModel} from "../../src/features/blogs/models/CreateBlogInputModel";
import {blogTestManager} from "../test-managers/blog-test-manager";
import {WEBSITE_URL_PATTERN} from "../../src/validation/field-validators/blogs-field-validators";
import {blogsCollection, client, postsCollection, runDb, setDb} from "../../src/db/db";
import {MongoMemoryServer} from "mongodb-memory-server";
import {UpdateBlogInputModel} from "../../src/features/blogs/models/UpdateBlogInputModel";
import {invalidAuthValues} from "../datasets/authorization-data";
import {invalidUrls, validBlogFieldInput} from "../datasets/validation/blogs-validation-data";
import {blogsQueryRepository} from "../../src/features/blogs/repositories/blogs.query-repository";
import {createBlogsPaginator} from "../../src/features/blogs/blogs.controller";
import {DEFAULT_QUERY_VALUES} from "../../src/helpers/query-params-values";
import {invalidPageNumbers, invalidPageSizes} from "../datasets/validation/validation-data";

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
                    description: 'superblog 1',
                    websiteUrl: 'https://superblog.com/1',
                    isDeleted: true,
                    createdAt: '2024-12-16T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '2',
                    name: 'b blog 2',
                    description: 'superblog 2',
                    websiteUrl: 'https://superblog.com/2',
                    isDeleted: false,
                    createdAt: '2024-12-17T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '3',
                    name: 'c neblog 3',
                    description: 'superblog 3',
                    websiteUrl: 'https://superblog.com/3',
                    isDeleted: false,
                    createdAt: '2024-12-18T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '4',
                    name: 'a 4 neBlog',
                    description: 'superblog 4',
                    websiteUrl: 'https://superblog.com/4',
                    isDeleted: false,
                    createdAt: '2024-12-15T05:32:26.882Z',
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
        it(`should return unordered blogs if sort field doesn't exist`, async () => {
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

            for (const invalidPageNumber of invalidPageNumbers) {
                const expected = createBlogsPaginator(
                    [], 0, 0, 0, 0,
                );

                await req
                    .get(SETTINGS.PATH.BLOGS + '?pageNumber=' + invalidPageNumber)
                    .expect(HTTP_STATUSES.OK_200, expected);
            }
        });

        // invalid pageSize
        it('should return empty array if page size is invalid', async () => {
            for (const invalidPageSize of invalidPageSizes) {
                const expected = createBlogsPaginator(
                    [], 0, 0, 0, 0,
                );

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

            const expectedBlogs = initialDbBlogs.slice(10, 20);
            const expected = createBlogsPaginator(
                expectedBlogs,
                pageNumber,
                DEFAULT_QUERY_VALUES.BLOGS.pageSize,
                Math.ceil(initialDbBlogs.length / DEFAULT_QUERY_VALUES.BLOGS.pageSize),
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

            const expectedBlogs = initialDbBlogs.slice((pageNumber - 1) * pageSize,
                (pageNumber - 1) * pageSize + pageSize);
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
            const pagesCount = Math.ceil(initialDbBlogs.length / DEFAULT_QUERY_VALUES.BLOGS.pageSize);
            const pageNumber = pagesCount + 5;

            const expectedBlogs: BlogDBType[] = [];
            const expected = createBlogsPaginator(
                expectedBlogs,
                pageNumber,
                DEFAULT_QUERY_VALUES.BLOGS.pageSize,
                pagesCount,
                initialDbBlogs.length,
            );

            await req
                .get(SETTINGS.PATH.BLOGS + '?pageNumber=' + pageNumber)
                .expect(HTTP_STATUSES.OK_200, expected);
        });

        // pageSize is greater than total number of items *
        it('should return all blogs if page size is greater than total number of items',
            async () => {
            const pageSize = initialDbBlogs.length + 10;

            const expected = createBlogsPaginator(
                initialDbBlogs,
                DEFAULT_QUERY_VALUES.BLOGS.pageNumber,
                pageSize,
                Math.ceil(initialDbBlogs.length / pageSize),
                initialDbBlogs.length,
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
                    isDeleted: false,
                    createdAt: '2024-12-15T05:32:26.882Z',
                },
                {
                    id: '2',
                    title: 'post 2',
                    shortDescription: 'superpost 2',
                    content: 'content of superpost 2',
                    blogId: '1',
                    isDeleted: false,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '3',
                    title: 'post 3',
                    shortDescription: 'superpost 3',
                    content: 'content of superpost 3',
                    blogId: '1',
                    isDeleted: true,
                    createdAt: '2024-12-16T05:32:26.882Z',
                },
                {
                    id: '4',
                    title: 'post 4',
                    shortDescription: 'superpost 4',
                    content: 'content of superpost 4',
                    blogId: '1',
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

            const dbBlogToDelete = await blogsCollection
                .findOne({ id: blogToDelete.id, isDeleted: false });
            expect(dbBlogToDelete).toEqual(null);

            const dbRelatedPosts = await postsCollection
                .find({ blogId: blogToDelete.id, isDeleted: false }).toArray() as PostDBType[];
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
                name: 'blog 1',
                description: 'superblog 1',
                websiteUrl: 'https://superblog.com/1',
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
                            message: 'Website url must match the following pattern: ' + WEBSITE_URL_PATTERN,
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

            await setDb({ blogs: initialDbBlogs } );
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
                            message: 'Website url must match the following pattern: ' + WEBSITE_URL_PATTERN,
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
    });
});