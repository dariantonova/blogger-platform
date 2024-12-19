import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {client, postsCollection, runDb, setDb} from "../../src/db/db";
import {encodeToBase64, HTTP_STATUSES} from "../../src/utils";
import {mapPostToViewModel} from "../../src/features/posts/posts.controller";
import {BlogDBType, PostDBType} from "../../src/types";
import {CreatePostInputModel} from "../../src/features/posts/models/CreatePostInputModel";
import {postTestManager} from "../test-managers/post-test-manager";
import {MongoMemoryServer} from "mongodb-memory-server";
import {blogTestManager} from "../test-managers/blog-test-manager";
import {CreateBlogInputModel} from "../../src/features/blogs/models/CreateBlogInputModel";
import {UpdatePostInputModel} from "../../src/features/posts/models/UpdatePostInputModel";

describe('tests for /posts', () => {
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

    describe('get posts', () => {

        beforeAll(async () => {
            await setDb();
        });
        
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

            const initialDbPosts: PostDBType[] = [
                {
                    id: '1',
                    title: 'post 1',
                    shortDescription: 'superpost 1',
                    content: 'content of superpost 1',
                    blogId: '2',
                    isDeleted: true,
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

            await setDb({ blogs: initialDbBlogs, posts: initialDbPosts });

            const expectedData = await Promise.all(initialDbPosts
                .filter(p => !p.isDeleted).map(mapPostToViewModel));
            await req
                .get(SETTINGS.PATH.POSTS)
                .expect(HTTP_STATUSES.OK_200, expectedData);
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

            const expectedData = await mapPostToViewModel(postToGet);
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

            const invalidAuthValues: string[] = [
                '',
                'Basic somethingWeird',
                'Basic ',
                `Bearer ${encodeToBase64(credentials)}`,
                encodeToBase64(credentials),
            ];

            for (const invalidAuthValue of invalidAuthValues) {
                await req
                    .delete(SETTINGS.PATH.POSTS + '/' + postToDelete.id)
                    .set('Authorization', invalidAuthValue)
                    .expect(HTTP_STATUSES.UNAUTHORIZED_401);
            }

            const dbPostToDelete = await postsCollection
                .findOne({ id: postToDelete.id }, { projection: { _id: 0 } });
            expect(dbPostToDelete).toEqual(postToDelete);
        });

        it('should return 404 when deleting non-existing post', async () => {
            await req
                .delete(SETTINGS.PATH.POSTS + '/-100')
                .set('Authorization', validAuth)
                .expect(HTTP_STATUSES.NOT_FOUND_404);

            // deleted
            const postToDelete = initialDbPosts[2];
            await req
                .delete(SETTINGS.PATH.POSTS + '/' + postToDelete.id)
                .set('Authorization', validAuth)
                .expect(HTTP_STATUSES.NOT_FOUND_404);
        });

        it('should delete the first post', async () => {
            const postToDelete = initialDbPosts[0];

            await req
                .delete(SETTINGS.PATH.POSTS + '/' + postToDelete.id)
                .set('Authorization', validAuth)
                .expect(HTTP_STATUSES.NO_CONTENT_204);

            const dbPostToDelete = await postsCollection
                .findOne({ id: postToDelete.id, isDeleted: false });
            expect(dbPostToDelete).toEqual(null);
        });
    });

    describe('create post', () => {
        let initialDbBlogs: BlogDBType[];

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
        });

        afterAll(async () => {
            await req
                .delete(SETTINGS.PATH.TESTING + '/all-data');
        });

        // authorization
        it('should forbid creating posts for non-admin users', async () => {
            const data: CreatePostInputModel = {
                title: 'post 1',
                shortDescription: 'superpost 1',
                content: 'content of superpost 1',
                blogId: initialDbBlogs[1].id,
            };

            // no auth
            await req
                .post(SETTINGS.PATH.POSTS)
                .send(data)
                .expect(HTTP_STATUSES.UNAUTHORIZED_401);

            const invalidAuthValues: string[] = [
                '',
                'Basic somethingWeird',
                'Basic ',
                `Bearer ${encodeToBase64(credentials)}`,
                encodeToBase64(credentials),
            ];

            for (const invalidAuthValue of invalidAuthValues) {
                await postTestManager.createPost(data, HTTP_STATUSES.UNAUTHORIZED_401,
                    invalidAuthValue);
            }

            expect(await postsCollection.find({}).toArray()).toEqual([]);
        });

        // validation
        it(`shouldn't create post if required fields are missing`, async () => {
            const data1 = {
                shortDescription: 'shortDescription',
                content: 'content',
                blogId: '1',
            };

            const response1 = await postTestManager.createPost(data1,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'title',
                        message: 'Title is required',
                    }
                ],
            });

            const data2 = {
                title: 'title',
                content: 'content',
                blogId: '1',
            };

            const response2 = await postTestManager.createPost(data2,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'shortDescription',
                        message: 'Short description is required',
                    }
                ],
            });

            const data3 = {
                title: 'title',
                shortDescription: 'shortDescription',
                blogId: '1',
            };

            const response3 = await postTestManager.createPost(data3,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'content',
                        message: 'Content is required',
                    }
                ],
            });

            const data4 = {
                title: 'title',
                shortDescription: 'shortDescription',
                content: 'content',
            };

            const response4 = await postTestManager.createPost(data4,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                shortDescription: 'shortDescription',
                content: 'content',
                blogId: '1',
            };

            const response1 = await postTestManager.createPost(data1,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                shortDescription: 'shortDescription',
                content: 'content',
                blogId: '1',
            };

            const response2 = await postTestManager.createPost(data2,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                shortDescription: 'shortDescription',
                content: 'content',
                blogId: '1',
            };

            const response3 = await postTestManager.createPost(data3,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                shortDescription: 'shortDescription',
                content: 'content',
                blogId: '1',
            };

            const response4 = await postTestManager.createPost(data4,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                title: 'title',
                shortDescription: 24,
                content: 'content',
                blogId: '1',
            };

            const response1 = await postTestManager.createPost(data1,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'shortDescription',
                        message: 'Short description must be a string',
                    }
                ],
            });

            const data2 = {
                title: 'title',
                shortDescription: '',
                content: 'content',
                blogId: '1',
            };

            const response2 = await postTestManager.createPost(data2,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'shortDescription',
                        message: 'Short description must not be empty',
                    }
                ],
            });

            const data3 = {
                title: 'title',
                shortDescription: '  ',
                content: 'content',
                blogId: '1',
            };

            const response3 = await postTestManager.createPost(data3,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'shortDescription',
                        message: 'Short description must not be empty',
                    }
                ],
            });

            const data4 = {
                title: 'title',
                shortDescription: 'a'.repeat(101),
                content: 'content',
                blogId: '1',
            };

            const response4 = await postTestManager.createPost(data4,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                title: 'title',
                shortDescription: 'shortDescription',
                content: 24,
                blogId: '1',
            };

            const response1 = await postTestManager.createPost(data1,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'content',
                        message: 'Content must be a string',
                    }
                ],
            });

            const data2 = {
                title: 'title',
                shortDescription: 'shortDescription',
                content: '',
                blogId: '1',
            };

            const response2 = await postTestManager.createPost(data2,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'content',
                        message: 'Content must not be empty',
                    }
                ],
            });

            const data3 = {
                title: 'title',
                shortDescription: 'shortDescription',
                content: '  ',
                blogId: '1',
            };

            const response3 = await postTestManager.createPost(data3,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'content',
                        message: 'Content must not be empty',
                    }
                ],
            });

            const data4 = {
                title: 'title',
                shortDescription: 'shortDescription',
                content: 'a'.repeat(1001),
                blogId: '1',
            };

            const response4 = await postTestManager.createPost(data4,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                title: 'title',
                shortDescription: 'shortDescription',
                content: 'content',
                blogId: 1,
            };

            const response1 = await postTestManager.createPost(data1,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'blogId',
                        message: 'Blog id must be a string',
                    }
                ],
            });

            const data2 = {
                title: 'title',
                shortDescription: 'shortDescription',
                content: 'content',
                blogId: '',
            };

            const response2 = await postTestManager.createPost(data2,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'blogId',
                        message: 'Blog id must not be empty',
                    }
                ],
            });

            const data3 = {
                title: 'title',
                shortDescription: 'shortDescription',
                content: 'content',
                blogId: '  ',
            };

            const response3 = await postTestManager.createPost(data3,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'blogId',
                        message: 'Blog id must not be empty',
                    }
                ],
            });

            const data4 = {
                title: 'title',
                shortDescription: 'shortDescription',
                content: 'content',
                blogId: '-100',
            };

            const response4 = await postTestManager.createPost(data4,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                HTTP_STATUSES.CREATED_201, validAuth);
            const createdBlog = createBlogResponse.body;

            const createPostData: CreatePostInputModel = {
                title: 'post 1',
                shortDescription: 'superpost 1',
                content: 'content of superpost 1',
                blogId: createdBlog.id,
            };

            await postTestManager.createPost(createPostData,
                HTTP_STATUSES.CREATED_201, validAuth);

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
                HTTP_STATUSES.CREATED_201, validAuth);

            const dbPosts = await postsCollection.find({}).toArray();
            expect(dbPosts.length).toBe(2);
        });
    });

    describe('update post', () => {
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

            await setDb({ blogs: initialDbBlogs, posts: initialDbPosts });
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

            const invalidAuthValues: string[] = [
                '',
                'Basic somethingWeird',
                'Basic ',
                `Bearer ${encodeToBase64(credentials)}`,
                encodeToBase64(credentials),
            ];

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
                shortDescription: 'shortDescription',
                content: 'content',
                blogId: initialDbBlogs[0].id,
            };

            const response1 = await postTestManager.updatePost(postToUpdate.id, data1,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'title',
                        message: 'Title is required',
                    }
                ],
            });

            const data2 = {
                title: 'title',
                content: 'content',
                blogId: initialDbBlogs[0].id,
            };

            const response2 = await postTestManager.updatePost(postToUpdate.id, data2,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'shortDescription',
                        message: 'Short description is required',
                    }
                ],
            });

            const data3 = {
                title: 'title',
                shortDescription: 'shortDescription',
                blogId: initialDbBlogs[0].id,
            };

            const response3 = await postTestManager.updatePost(postToUpdate.id, data3,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'content',
                        message: 'Content is required',
                    }
                ],
            });

            const data4 = {
                title: 'title',
                shortDescription: 'shortDescription',
                content: 'content',
            };

            const response4 = await postTestManager.updatePost(postToUpdate.id, data4,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                shortDescription: 'shortDescription',
                content: 'content',
                blogId: initialDbBlogs[0].id,
            };

            const response1 = await postTestManager.updatePost(postToUpdate.id, data1,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                shortDescription: 'shortDescription',
                content: 'content',
                blogId: initialDbBlogs[0].id,
            };

            const response2 = await postTestManager.updatePost(postToUpdate.id, data2,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                shortDescription: 'shortDescription',
                content: 'content',
                blogId: initialDbBlogs[0].id,
            };

            const response3 = await postTestManager.updatePost(postToUpdate.id, data3,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                shortDescription: 'shortDescription',
                content: 'content',
                blogId: initialDbBlogs[0].id,
            };

            const response4 = await postTestManager.updatePost(postToUpdate.id, data4,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                title: 'title',
                shortDescription: 24,
                content: 'content',
                blogId: initialDbBlogs[0].id,
            };

            const response1 = await postTestManager.updatePost(postToUpdate.id, data1,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'shortDescription',
                        message: 'Short description must be a string',
                    }
                ],
            });

            const data2 = {
                title: 'title',
                shortDescription: '',
                content: 'content',
                blogId: initialDbBlogs[0].id,
            };

            const response2 = await postTestManager.updatePost(postToUpdate.id, data2,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'shortDescription',
                        message: 'Short description must not be empty',
                    }
                ],
            });

            const data3 = {
                title: 'title',
                shortDescription: '  ',
                content: 'content',
                blogId: initialDbBlogs[0].id,
            };

            const response3 = await postTestManager.updatePost(postToUpdate.id, data3,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'shortDescription',
                        message: 'Short description must not be empty',
                    }
                ],
            });

            const data4 = {
                title: 'title',
                shortDescription: 'a'.repeat(101),
                content: 'content',
                blogId: initialDbBlogs[0].id,
            };

            const response4 = await postTestManager.updatePost(postToUpdate.id, data4,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                title: 'title',
                shortDescription: 'shortDescription',
                content: 24,
                blogId: initialDbBlogs[0].id,
            };

            const response1 = await postTestManager.updatePost(postToUpdate.id, data1,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'content',
                        message: 'Content must be a string',
                    }
                ],
            });

            const data2 = {
                title: 'title',
                shortDescription: 'shortDescription',
                content: '',
                blogId: initialDbBlogs[0].id,
            };

            const response2 = await postTestManager.updatePost(postToUpdate.id, data2,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'content',
                        message: 'Content must not be empty',
                    }
                ],
            });

            const data3 = {
                title: 'title',
                shortDescription: 'shortDescription',
                content: '  ',
                blogId: initialDbBlogs[0].id,
            };

            const response3 = await postTestManager.updatePost(postToUpdate.id, data3,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'content',
                        message: 'Content must not be empty',
                    }
                ],
            });

            const data4 = {
                title: 'title',
                shortDescription: 'shortDescription',
                content: 'a'.repeat(1001),
                blogId: initialDbBlogs[0].id,
            };

            const response4 = await postTestManager.updatePost(postToUpdate.id, data4,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                title: 'title',
                shortDescription: 'shortDescription',
                content: 'content',
                blogId: 1,
            };

            const response1 = await postTestManager.updatePost(postToUpdate.id, data1,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'blogId',
                        message: 'Blog id must be a string',
                    }
                ],
            });

            const data2 = {
                title: 'title',
                shortDescription: 'shortDescription',
                content: 'content',
                blogId: '',
            };

            const response2 = await postTestManager.updatePost(postToUpdate.id, data2,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'blogId',
                        message: 'Blog id must not be empty',
                    }
                ],
            });

            const data3 = {
                title: 'title',
                shortDescription: 'shortDescription',
                content: 'content',
                blogId: '  ',
            };

            const response3 = await postTestManager.updatePost(postToUpdate.id, data3,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'blogId',
                        message: 'Blog id must not be empty',
                    }
                ],
            });

            const data4 = {
                title: 'title',
                shortDescription: 'shortDescription',
                content: 'content',
                blogId: '-100',
            };

            const response4 = await postTestManager.updatePost(postToUpdate.id, data4,
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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
                HTTP_STATUSES.BAD_REQUEST_400, validAuth);
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

            await postTestManager.updatePost('-100', data, HTTP_STATUSES.NOT_FOUND_404, validAuth);

            // deleted
            const postToUpdate = initialDbPosts[2];
            await postTestManager.updatePost(postToUpdate.id, data, HTTP_STATUSES.NOT_FOUND_404, validAuth);
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

            await postTestManager.updatePost(postToUpdate.id, data, HTTP_STATUSES.NO_CONTENT_204, validAuth);

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