import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {HTTP_STATUSES} from "../../src/utils";
import {BlogDBType, PostDBType} from "../../src/types";
import {mapBlogToViewModel} from "../../src/features/blogs/blogs.controller";
import {CreateBlogInputModel} from "../../src/features/blogs/models/CreateBlogInputModel";
import {blogTestManager} from "../test-managers/blog-test-manager";
import {WEBSITE_URL_PATTERN} from "../../src/validation/field-validators/blogs-field-validators";
import {blogsCollection, client, postsCollection, runDb, setDb} from "../../src/db/db";
import {MongoMemoryServer} from "mongodb-memory-server";
import {UpdateBlogInputModel} from "../../src/features/blogs/models/UpdateBlogInputModel";
import {invalidAuthValues} from "../datasets/authorization-data";
import {invalidUrls, validBlogFieldInput} from "../datasets/validation/blogs-validation-data";

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
            await req
                .get(SETTINGS.PATH.BLOGS)
                .expect(HTTP_STATUSES.OK_200, []);
        });

        it('should return array with all blogs', async () => {
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
                    createdAt: '2024-12-17T05:32:26.882Z',
                    isMembership: false,
                },
                {
                    id: '4',
                    name: '4 neBlog',
                    description: 'superblog 4',
                    websiteUrl: 'https://superblog.com/4',
                    isDeleted: false,
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

        it('should return blogs with name containing search name term', async () => {
            const searchNameTerm = 'neblog';

            await req
                .get(SETTINGS.PATH.BLOGS + '?searchNameTerm=' + searchNameTerm)
                .expect(HTTP_STATUSES.OK_200, [initialDbBlogs[1], initialDbBlogs[3]].map(mapBlogToViewModel));
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