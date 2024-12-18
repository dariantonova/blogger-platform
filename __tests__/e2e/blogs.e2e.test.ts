import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {encodeToBase64, HTTP_STATUSES} from "../../src/utils";
import {BlogDBType, PostDBType} from "../../src/types";
import * as datasets from '../datasets';
import {mapBlogToViewModel} from "../../src/features/blogs/blogs.controller";
import {CreateBlogInputModel} from "../../src/features/blogs/models/CreateBlogInputModel";
import {blogTestManager} from "../test-managers/blog-test-manager";
import {WEBSITE_URL_PATTERN} from "../../src/validation/field-validators/blogs-field-validators";
import {BlogViewModel} from "../../src/features/blogs/models/BlogViewModel";
import {blogsCollection, client, postsCollection, runDb, setDb} from "../../src/db/db";
import {MongoMemoryServer} from "mongodb-memory-server";

describe('tests for /blogs', () => {
    let server: MongoMemoryServer;
    const validAuth = 'Basic YWRtaW46cXdlcnR5';
    const credentials = SETTINGS.CREDENTIALS.LOGIN + ':' + SETTINGS.CREDENTIALS.PASSWORD;

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
        beforeAll(async () => {
            await setDb();
        });

        afterAll(async () => {
            await req
                .delete(SETTINGS.PATH.TESTING + '/all-data');
        });

        it('should return empty array', async () => {
            await req
                .get(SETTINGS.PATH.BLOGS)
                .expect(HTTP_STATUSES.OK_200, []);
        });

        it('should return array with all blogs', async () => {
            const initialDbBlogs: BlogDBType[] = [
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

            await req
                .get(SETTINGS.PATH.BLOGS)
                .expect(HTTP_STATUSES.OK_200,
                    initialDbBlogs.filter(b => !b.isDeleted).map(mapBlogToViewModel));
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
                .expect(HTTP_STATUSES.OK_200, mapBlogToViewModel(blogToGet));
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

            const invalidAuthValues: string[] = [
                '',
                'Basic somethingWeird',
                'Basic ',
                `Bearer ${encodeToBase64(credentials)}`,
                encodeToBase64(credentials),
            ];

            for (const invalidAuthValue of invalidAuthValues) {
                await req
                    .delete(SETTINGS.PATH.BLOGS + '/' + blogToDelete.id)
                    .set('Authorization', invalidAuthValue)
                    .expect(HTTP_STATUSES.UNAUTHORIZED_401);
            }

            const dbBlogToDelete = await blogsCollection
                .findOne({ id: blogToDelete.id }, { projection: {_id: 0} }) as BlogDBType;
            expect(dbBlogToDelete).toEqual(blogToDelete);

            const dbPosts = await postsCollection
                .find({ blogId: blogToDelete.id }, { projection: {_id: 0} }).toArray() as PostDBType[];
            const expectedPosts = initialDbPosts.filter(p => p.blogId === blogToDelete.id);
            expect(dbPosts).toEqual(expectedPosts);
        });

        it('should return 404 when deleting non-existing blog', async () => {
            await req
                .delete(SETTINGS.PATH.BLOGS + '/-100')
                .set('Authorization', validAuth)
                .expect(HTTP_STATUSES.NOT_FOUND_404);

            // deleted
            const blogToDelete = initialDbBlogs[2];
            await req
                .delete(SETTINGS.PATH.BLOGS + '/' + blogToDelete.id)
                .set('Authorization', validAuth)
                .expect(HTTP_STATUSES.NOT_FOUND_404);
        });

        it('should delete the first blog and all related posts', async () => {
            const blogToDelete = initialDbBlogs[0];

            await req
                .delete(SETTINGS.PATH.BLOGS + '/' + blogToDelete.id)
                .set('Authorization', validAuth)
                .expect(HTTP_STATUSES.NO_CONTENT_204);

            expect(await blogsCollection
                .findOne({ id: blogToDelete.id, isDeleted: false })).toEqual(null);

            expect(await postsCollection
                .find({ blogId: blogToDelete.id, isDeleted: false }).toArray()).toEqual([]);
        });
    });

    describe('create blog', () => {
        let createdBlogs: BlogViewModel[] = [];

        beforeAll(async () => {
            await setDb();
        });

        afterAll(async () => {
            await req
                .delete(SETTINGS.PATH.TESTING + '/all-data');
        });

        // authorization
        it('should forbid creating blogs for non-admin users', async () => {
            const {name, description, websiteUrl} = datasets.blogs[0];
            const data: CreateBlogInputModel = {name, description, websiteUrl};

            await req
                .post(SETTINGS.PATH.BLOGS)
                .send(data)
                .expect(HTTP_STATUSES.UNAUTHORIZED_401);

            await blogTestManager.createBlog(data, HTTP_STATUSES.UNAUTHORIZED_401,
                'Basic somethingWeird');

            await blogTestManager.createBlog(data, HTTP_STATUSES.UNAUTHORIZED_401,
                'Basic ');

            const credentials = SETTINGS.CREDENTIALS.LOGIN + ':' + SETTINGS.CREDENTIALS.PASSWORD;

            await blogTestManager.createBlog(data, HTTP_STATUSES.UNAUTHORIZED_401,
                `Bearer ${encodeToBase64(credentials)}`);

            await blogTestManager.createBlog(data, HTTP_STATUSES.UNAUTHORIZED_401,
                encodeToBase64(credentials));

            await req
                .get(SETTINGS.PATH.BLOGS)
                .expect(HTTP_STATUSES.OK_200, []);
        });

        // validation
        it(`shouldn't create blog if required fields are missing`, async () => {
            const data1 = {
                description: 'description',
                websiteUrl: 'https://superblog.com',
            };

            const response1 = await blogTestManager.createBlog(data1,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'name',
                        message: 'Name is required',
                    }
                ],
            });

            const data2 = {
                name: 'name',
                websiteUrl: 'https://superblog.com',
            };

            const response2 = await blogTestManager.createBlog(data2,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'description',
                        message: 'Description is required',
                    }
                ],
            });

            const data3 = {
                name: 'name',
                description: 'description',
            };

            const response3 = await blogTestManager.createBlog(data3,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'websiteUrl',
                        message: 'Website url is required',
                    }
                ],
            });

            await req
                .get(SETTINGS.PATH.BLOGS)
                .expect(HTTP_STATUSES.OK_200, []);
        });

        it(`shouldn't create blog if name is invalid`, async () => {
            // not string
            const data1 = {
                name: 24,
                description: 'description',
                websiteUrl: 'https://superblog.com',
            };

            const response1 = await blogTestManager.createBlog(data1,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                description: 'description',
                websiteUrl: 'https://superblog.com',
            };

            const response2 = await blogTestManager.createBlog(data2,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                description: 'description',
                websiteUrl: 'https://superblog.com',
            };

            const response3 = await blogTestManager.createBlog(data3,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                description: 'description',
                websiteUrl: 'https://superblog.com',
            };

            const response4 = await blogTestManager.createBlog(data4,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'name',
                        message: 'Name length must be between 1 and 15 symbols',
                    }
                ],
            });

            await req
                .get(SETTINGS.PATH.BLOGS)
                .expect(HTTP_STATUSES.OK_200, []);
        });

        it(`shouldn't create blog if description is invalid`, async () => {
            // not string
            const data1 = {
                name: 'name',
                description: 24,
                websiteUrl: 'https://superblog.com',
            };

            const response1 = await blogTestManager.createBlog(data1,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                name: 'name',
                description: '',
                websiteUrl: 'https://superblog.com',
            };

            const response2 = await blogTestManager.createBlog(data2,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                name: 'name',
                description: '  ',
                websiteUrl: 'https://superblog.com',
            };

            const response3 = await blogTestManager.createBlog(data3,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                name: 'name',
                description: 'a'.repeat(501),
                websiteUrl: 'https://superblog.com',
            };

            const response4 = await blogTestManager.createBlog(data4,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'description',
                        message: 'Description length must be between 1 and 500 symbols',
                    }
                ],
            });

            await req
                .get(SETTINGS.PATH.BLOGS)
                .expect(HTTP_STATUSES.OK_200, []);
        });

        it(`shouldn't create blog if website url is invalid`, async () => {
            // not string
            const data1 = {
                name: 'name',
                description: 'description',
                websiteUrl: 24,
            };

            const response1 = await blogTestManager.createBlog(data1,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                name: 'name',
                description: 'description',
                websiteUrl: '',
            };

            const response2 = await blogTestManager.createBlog(data2,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                name: 'name',
                description: 'description',
                websiteUrl: '  ',
            };

            const response3 = await blogTestManager.createBlog(data3,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                name: 'name',
                description: 'description',
                websiteUrl: 'a'.repeat(101),
            };

            const response4 = await blogTestManager.createBlog(data4,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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

            const invalidUrlData1 = {
                name: 'name',
                description: 'description',
                websiteUrl: 'http://superblog.com',
            };
            invalidUrlData.push(invalidUrlData1);

            const invalidUrlData2 = {
                name: 'name',
                description: 'description',
                websiteUrl: 'https:superblog.com',
            };
            invalidUrlData.push(invalidUrlData2);

            const invalidUrlData3 = {
                name: 'name',
                description: 'description',
                websiteUrl: 'superblog.com',
            };
            invalidUrlData.push(invalidUrlData3);

            const invalidUrlData4 = {
                name: 'name',
                description: 'description',
                websiteUrl: 'https://superblog',
            };
            invalidUrlData.push(invalidUrlData4);

            const invalidUrlData5 = {
                name: 'name',
                description: 'description',
                websiteUrl: 'https://superblog.',
            };
            invalidUrlData.push(invalidUrlData5);

            const invalidUrlData6 = {
                name: 'name',
                description: 'description',
                websiteUrl: 'https://.com',
            };
            invalidUrlData.push(invalidUrlData6);

            const invalidUrlData7 = {
                name: 'name',
                description: 'description',
                websiteUrl: 'https://superblog!.com',
            };
            invalidUrlData.push(invalidUrlData7);

            for (const dataItem of invalidUrlData) {
                const response = await blogTestManager.createBlog(dataItem,
                    HTTP_STATUSES.BAD_REQUEST_400, validAuth);
                expect(response.body).toEqual({
                    errorsMessages: [
                        {
                            field: 'websiteUrl',
                            message: 'Website url must match the following pattern: ' + WEBSITE_URL_PATTERN,
                        }
                    ],
                });
            }

            await req
                .get(SETTINGS.PATH.BLOGS)
                .expect(HTTP_STATUSES.OK_200, []);
        });

        it(`shouldn't create blog if multiple fields are invalid`, async () => {
            const data = {
                name: 'a'.repeat(20),
                description: '  ',
            };

            const createResponse = await blogTestManager.createBlog(data,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(createResponse.body).toEqual({
                errorsMessages: expect.arrayContaining([
                    { message: expect.any(String), field: 'name' },
                    { message: expect.any(String), field: 'description' },
                    { message: expect.any(String), field: 'websiteUrl' },
                ]),
            });

            await req
                .get(SETTINGS.PATH.BLOGS)
                .expect(HTTP_STATUSES.OK_200, []);
        });

        // correct input
        it('should create blog if input data is correct', async () => {
            const {name, description, websiteUrl} = datasets.blogs[0];
            const data: CreateBlogInputModel = {name, description, websiteUrl};

            const createResponse = await blogTestManager
                .createBlog(data, HTTP_STATUSES.CREATED_201, validAuth);

            const createdBlog = createResponse.body;
            await req
                .get(SETTINGS.PATH.BLOGS)
                .expect(HTTP_STATUSES.OK_200, [createdBlog]);

            createdBlogs.push(createdBlog);
        });

        it('should create one more blog', async () => {
            const {name, description, websiteUrl} = datasets.blogs[1];
            const data: CreateBlogInputModel = {name, description, websiteUrl};

            const createResponse = await blogTestManager
                .createBlog(data, HTTP_STATUSES.CREATED_201, validAuth);

            const createdBlog = createResponse.body;
            await req
                .get(SETTINGS.PATH.BLOGS)
                .expect(HTTP_STATUSES.OK_200, [...createdBlogs, createdBlog]);

            createdBlogs.push(createdBlog);
        });
    });

    describe('update blog', () => {
        let createdBlogs: BlogViewModel[] = [];

        beforeAll(async () => {
            await setDb({ blogs: datasets.blogs } )
            createdBlogs = datasets.blogs.map(mapBlogToViewModel);
        });

        afterAll(async () => {
            await req
                .delete(SETTINGS.PATH.TESTING + '/all-data');
        });

        // authorization
        it('should forbid updating blogs for non-admin users', async () => {
            const data = datasets.blogsDataForUpdate[0];
            const blogId = createdBlogs[0].id;

            await req
                .put(SETTINGS.PATH.BLOGS + '/' + blogId)
                .send(data)
                .expect(HTTP_STATUSES.UNAUTHORIZED_401);

            await blogTestManager.updateBlog(blogId, data, HTTP_STATUSES.UNAUTHORIZED_401,
                'Basic somethingWeird');

            await blogTestManager.updateBlog(blogId, data, HTTP_STATUSES.UNAUTHORIZED_401,
                'Basic ');

            const credentials = SETTINGS.CREDENTIALS.LOGIN + ':' + SETTINGS.CREDENTIALS.PASSWORD;

            await blogTestManager.updateBlog(blogId, data, HTTP_STATUSES.UNAUTHORIZED_401,
                `Bearer ${encodeToBase64(credentials)}`);

            await blogTestManager.updateBlog(blogId, data, HTTP_STATUSES.UNAUTHORIZED_401,
                encodeToBase64(credentials));

            await req
                .get(SETTINGS.PATH.BLOGS)
                .expect(HTTP_STATUSES.OK_200, createdBlogs);
        });

        // validation
        it(`shouldn't update blog if required fields are missing`, async () => {
            const blogId = createdBlogs[0].id;

            const data1 = {
                description: 'description',
                websiteUrl: 'https://superblog.com',
            };

            const response1 = await blogTestManager.updateBlog(blogId, data1,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'name',
                        message: 'Name is required',
                    }
                ],
            });

            const data2 = {
                name: 'name',
                websiteUrl: 'https://superblog.com',
            };

            const response2 = await blogTestManager.updateBlog(blogId, data2,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'description',
                        message: 'Description is required',
                    }
                ],
            });

            const data3 = {
                name: 'name',
                description: 'description',
            };

            const response3 = await blogTestManager.updateBlog(blogId, data3,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'websiteUrl',
                        message: 'Website url is required',
                    }
                ],
            });

            await req
                .get(SETTINGS.PATH.BLOGS)
                .expect(HTTP_STATUSES.OK_200, createdBlogs);
        });

        it(`shouldn't update blog if name is invalid`, async () => {
            const blogId = createdBlogs[0].id;

            // not string
            const data1 = {
                name: 24,
                description: 'description',
                websiteUrl: 'https://superblog.com',
            };

            const response1 = await blogTestManager.updateBlog(blogId, data1,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                description: 'description',
                websiteUrl: 'https://superblog.com',
            };

            const response2 = await blogTestManager.updateBlog(blogId, data2,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                description: 'description',
                websiteUrl: 'https://superblog.com',
            };

            const response3 = await blogTestManager.updateBlog(blogId, data3,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                description: 'description',
                websiteUrl: 'https://superblog.com',
            };

            const response4 = await blogTestManager.updateBlog(blogId, data4,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'name',
                        message: 'Name length must be between 1 and 15 symbols',
                    }
                ],
            });

            await req
                .get(SETTINGS.PATH.BLOGS)
                .expect(HTTP_STATUSES.OK_200, createdBlogs);
        });

        it(`shouldn't update blog if description is invalid`, async () => {
            const blogId = createdBlogs[0].id;

            // not string
            const data1 = {
                name: 'name',
                description: 24,
                websiteUrl: 'https://superblog.com',
            };

            const response1 = await blogTestManager.updateBlog(blogId, data1,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                name: 'name',
                description: '',
                websiteUrl: 'https://superblog.com',
            };

            const response2 = await blogTestManager.updateBlog(blogId, data2,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                name: 'name',
                description: '  ',
                websiteUrl: 'https://superblog.com',
            };

            const response3 = await blogTestManager.updateBlog(blogId, data3,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                name: 'name',
                description: 'a'.repeat(501),
                websiteUrl: 'https://superblog.com',
            };

            const response4 = await blogTestManager.updateBlog(blogId, data4,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'description',
                        message: 'Description length must be between 1 and 500 symbols',
                    }
                ],
            });

            await req
                .get(SETTINGS.PATH.BLOGS)
                .expect(HTTP_STATUSES.OK_200, createdBlogs);
        });

        it(`shouldn't update blog if website url is invalid`, async () => {
            const blogId = createdBlogs[0].id;

            // not string
            const data1 = {
                name: 'name',
                description: 'description',
                websiteUrl: 24,
            };

            const response1 = await blogTestManager.updateBlog(blogId, data1,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                name: 'name',
                description: 'description',
                websiteUrl: '',
            };

            const response2 = await blogTestManager.updateBlog(blogId, data2,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                name: 'name',
                description: 'description',
                websiteUrl: '  ',
            };

            const response3 = await blogTestManager.updateBlog(blogId, data3,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                name: 'name',
                description: 'description',
                websiteUrl: 'a'.repeat(101),
            };

            const response4 = await blogTestManager.updateBlog(blogId, data4,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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

            const invalidUrlData1 = {
                name: 'name',
                description: 'description',
                websiteUrl: 'http://superblog.com',
            };
            invalidUrlData.push(invalidUrlData1);

            const invalidUrlData2 = {
                name: 'name',
                description: 'description',
                websiteUrl: 'https:superblog.com',
            };
            invalidUrlData.push(invalidUrlData2);

            const invalidUrlData3 = {
                name: 'name',
                description: 'description',
                websiteUrl: 'superblog.com',
            };
            invalidUrlData.push(invalidUrlData3);

            const invalidUrlData4 = {
                name: 'name',
                description: 'description',
                websiteUrl: 'https://superblog',
            };
            invalidUrlData.push(invalidUrlData4);

            const invalidUrlData5 = {
                name: 'name',
                description: 'description',
                websiteUrl: 'https://superblog.',
            };
            invalidUrlData.push(invalidUrlData5);

            const invalidUrlData6 = {
                name: 'name',
                description: 'description',
                websiteUrl: 'https://.com',
            };
            invalidUrlData.push(invalidUrlData6);

            const invalidUrlData7 = {
                name: 'name',
                description: 'description',
                websiteUrl: 'https://superblog!.com',
            };
            invalidUrlData.push(invalidUrlData7);

            for (const dataItem of invalidUrlData) {
                const response = await blogTestManager.updateBlog(blogId, dataItem,
                    HTTP_STATUSES.BAD_REQUEST_400, validAuth);
                expect(response.body).toEqual({
                    errorsMessages: [
                        {
                            field: 'websiteUrl',
                            message: 'Website url must match the following pattern: ' + WEBSITE_URL_PATTERN,
                        }
                    ],
                });
            }

            await req
                .get(SETTINGS.PATH.BLOGS)
                .expect(HTTP_STATUSES.OK_200, createdBlogs);
        });

        it(`shouldn't update blog if multiple fields are invalid`, async () => {
            const blogId = createdBlogs[0].id;

            const data = {
                name: 'a'.repeat(20),
                description: '  ',
            };

            const createResponse = await blogTestManager.updateBlog(blogId, data,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(createResponse.body).toEqual({
                errorsMessages: expect.arrayContaining([
                    { message: expect.any(String), field: 'name' },
                    { message: expect.any(String), field: 'description' },
                    { message: expect.any(String), field: 'websiteUrl' },
                ]),
            });

            await req
                .get(SETTINGS.PATH.BLOGS)
                .expect(HTTP_STATUSES.OK_200, createdBlogs);
        });

        // non-existing blog
        it('should return 404 when updating non-existing blog', async () => {
            await blogTestManager.updateBlog('-100', datasets.blogsDataForUpdate[0],
                HTTP_STATUSES.NOT_FOUND_404, validAuth);
        });

        // correct input
        it('should update blog if input data is correct', async () => {
            const data = datasets.blogsDataForUpdate[0];
            const blogId = createdBlogs[0].id;

            await blogTestManager.updateBlog(blogId, data,
                HTTP_STATUSES.NO_CONTENT_204, validAuth);

            await req
                .get(SETTINGS.PATH.BLOGS + '/' + createdBlogs[1].id)
                .expect(HTTP_STATUSES.OK_200, createdBlogs[1]);
        });

        // deleted blog
        it(`should return 404 when updating deleted blog`, async () => {
            const blogs = datasets.blogsWithDeleted;
            await setDb({ blogs } );

            await blogTestManager.updateBlog(blogs[0].id, datasets.blogsDataForUpdate[0],
                HTTP_STATUSES.NOT_FOUND_404, validAuth);
        });
    });
});