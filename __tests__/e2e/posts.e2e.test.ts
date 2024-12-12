import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {db, setDB} from "../../src/db/db";
import {encodeToBase64, HTTP_STATUSES} from "../../src/utils";
import * as datasets from "../datasets";
import {mapPostToViewModel} from "../../src/features/posts/posts.controller";
import {PostDBType} from "../../src/types";
import {getValidAuthValue} from "../../src/middlewares/authorization-middleware";
import {CreatePostInputModel} from "../../src/features/posts/models/CreatePostInputModel";
import {postTestManager} from "../test-managers/post-test-manager";
import {PostViewModel} from "../../src/features/posts/models/PostViewModel";

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

    describe('create post', () => {
        let createdPosts: PostViewModel[] = [];

        beforeAll(() => {
            setDB({ blogs: datasets.blogs });
        });

        afterAll(async () => {
            await req
                .delete(SETTINGS.PATH.TESTING + '/all-data');
        });

        // authorization
        it('should forbid creating posts for non-admin users', async () => {
            const datasetPost = datasets.posts[0];
            const data: CreatePostInputModel = {
                title: datasetPost.title,
                shortDescription: datasetPost.shortDescription,
                content: datasetPost.content,
                blogId: datasetPost.blogId,
            };

            await req
                .post(SETTINGS.PATH.POSTS)
                .send(data)
                .expect(HTTP_STATUSES.UNAUTHORIZED_401);

            await postTestManager.createPost(data, HTTP_STATUSES.UNAUTHORIZED_401,
                'Basic somethingWeird');

            await postTestManager.createPost(data, HTTP_STATUSES.UNAUTHORIZED_401,
                'Basic ');

            const credentials = SETTINGS.CREDENTIALS.LOGIN + ':' + SETTINGS.CREDENTIALS.PASSWORD;

            await postTestManager.createPost(data, HTTP_STATUSES.UNAUTHORIZED_401,
                `Bearer ${encodeToBase64(credentials)}`);

            await postTestManager.createPost(data, HTTP_STATUSES.UNAUTHORIZED_401,
                encodeToBase64(credentials));

            await req
                .get(SETTINGS.PATH.POSTS)
                .expect(HTTP_STATUSES.OK_200, []);
        });

        // validation
        it(`shouldn't create post if required fields are missing`, async () => {
            const data1 = {
                shortDescription: 'shortDescription',
                content: 'content',
                blogId: '1',
            };

            const response1 = await postTestManager.createPost(data1,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'blogId',
                        message: 'Blog id is required',
                    }
                ],
            });

            await req
                .get(SETTINGS.PATH.POSTS)
                .expect(HTTP_STATUSES.OK_200, []);
        });

        it(`shouldn't create post if title is invalid`, async () => {
            const data1 = {
                title: 24,
                shortDescription: 'shortDescription',
                content: 'content',
                blogId: '1',
            };

            const response1 = await postTestManager.createPost(data1,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'title',
                        message: 'Title length must be between 1 and 30 symbols',
                    }
                ],
            });

            await req
                .get(SETTINGS.PATH.POSTS)
                .expect(HTTP_STATUSES.OK_200, []);
        });

        it(`shouldn't create post if short description is invalid`, async () => {
            const data1 = {
                title: 'title',
                shortDescription: 24,
                content: 'content',
                blogId: '1',
            };

            const response1 = await postTestManager.createPost(data1,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'shortDescription',
                        message: 'Short description length must be between 1 and 100 symbols',
                    }
                ],
            });

            await req
                .get(SETTINGS.PATH.POSTS)
                .expect(HTTP_STATUSES.OK_200, []);
        });

        it(`shouldn't create post if content is invalid`, async () => {
            const data1 = {
                title: 'title',
                shortDescription: 'shortDescription',
                content: 24,
                blogId: '1',
            };

            const response1 = await postTestManager.createPost(data1,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'content',
                        message: 'Content length must be between 1 and 1000 symbols',
                    }
                ],
            });

            await req
                .get(SETTINGS.PATH.POSTS)
                .expect(HTTP_STATUSES.OK_200, []);
        });

        it(`shouldn't create post if blog id is invalid`, async () => {
            const data1 = {
                title: 'title',
                shortDescription: 'shortDescription',
                content: 'content',
                blogId: 1,
            };

            const response1 = await postTestManager.createPost(data1,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'blogId',
                        message: 'Blog id does not exist',
                    }
                ],
            });

            await req
                .get(SETTINGS.PATH.POSTS)
                .expect(HTTP_STATUSES.OK_200, []);
        });

        it(`shouldn't create post if multiple fields are invalid`, async () => {
            const data = {
                title: 'a'.repeat(31),
                shortDescription: '  ',
                blogId: '-100',
            };

            const response = await postTestManager.createPost(data,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
            expect(response.body).toEqual({
                errorsMessages: expect.arrayContaining([
                    { field: 'title', message: 'Title length must be between 1 and 30 symbols' },
                    { field: 'shortDescription', message: 'Short description must not be empty' },
                    { field: 'content', message: 'Content is required' },
                    { field: 'blogId', message: 'Blog id does not exist' },
                ]),
            });

            await req
                .get(SETTINGS.PATH.POSTS)
                .expect(HTTP_STATUSES.OK_200, []);
        });

        // correct input
        it('should create post if input data is correct', async () => {
            const datasetPost = datasets.posts[0];
            const data: CreatePostInputModel = {
                title: datasetPost.title,
                shortDescription: datasetPost.shortDescription,
                content: datasetPost.content,
                blogId: datasetPost.blogId,
            };

            const createResponse = await postTestManager.createPost(data,
                HTTP_STATUSES.CREATED_201, getValidAuthValue());

            const createdPost: PostViewModel = createResponse.body;
            await req
                .get(SETTINGS.PATH.POSTS)
                .expect(HTTP_STATUSES.OK_200, [createdPost]);

            createdPosts.push(createdPost);
        });

        it('should create one more post', async () => {
            const datasetPost = datasets.posts[1];
            const data: CreatePostInputModel = {
                title: datasetPost.title,
                shortDescription: datasetPost.shortDescription,
                content: datasetPost.content,
                blogId: datasetPost.blogId,
            };

            const createResponse = await postTestManager.createPost(data,
                HTTP_STATUSES.CREATED_201, getValidAuthValue());

            const createdPost: PostViewModel = createResponse.body;
            await req
                .get(SETTINGS.PATH.POSTS)
                .expect(HTTP_STATUSES.OK_200, [...createdPosts, createdPost]);

            createdPosts.push(createdPost);
        });
    });

    describe('update post', () => {
        let createdPosts: PostViewModel[] = [];

        beforeAll(async () => {
            const posts = datasets.posts;
            setDB({ posts, blogs: datasets.blogs });
            createdPosts = posts.map(mapPostToViewModel);
        });

        afterAll(async () => {
            await req
                .delete(SETTINGS.PATH.TESTING + '/all-data');
        });

        // authorization
        it('should forbid updating posts for non-admin users', async () => {
            const data = datasets.postsDataForUpdate[0];
            const postId = createdPosts[0].id;

            await req
                .put(SETTINGS.PATH.POSTS + '/' + postId)
                .send(data)
                .expect(HTTP_STATUSES.UNAUTHORIZED_401);

            await postTestManager.updatePost(postId, data, HTTP_STATUSES.UNAUTHORIZED_401,
                'Basic somethingWeird');

            await postTestManager.updatePost(postId, data, HTTP_STATUSES.UNAUTHORIZED_401,
                'Basic ');

            const credentials = SETTINGS.CREDENTIALS.LOGIN + ':' + SETTINGS.CREDENTIALS.PASSWORD;

            await postTestManager.updatePost(postId, data, HTTP_STATUSES.UNAUTHORIZED_401,
                `Bearer ${encodeToBase64(credentials)}`);

            await postTestManager.updatePost(postId, data, HTTP_STATUSES.UNAUTHORIZED_401,
                encodeToBase64(credentials));

            await req
                .get(SETTINGS.PATH.POSTS)
                .expect(HTTP_STATUSES.OK_200, createdPosts);
        });

        // validation
        it(`shouldn't update post if required fields are missing`, async () => {
            const postId = createdPosts[0].id;

            const data1 = {
                shortDescription: 'shortDescription',
                content: 'content',
                blogId: '1',
            };

            const response1 = await postTestManager.updatePost(postId, data1,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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

            const response2 = await postTestManager.updatePost(postId, data2,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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

            const response3 = await postTestManager.updatePost(postId, data3,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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

            const response4 = await postTestManager.updatePost(postId, data4,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'blogId',
                        message: 'Blog id is required',
                    }
                ],
            });

            await req
                .get(SETTINGS.PATH.POSTS)
                .expect(HTTP_STATUSES.OK_200, createdPosts);
        });

        it(`shouldn't update post if title is invalid`, async () => {
            const postId = createdPosts[0].id;

            const data1 = {
                title: 24,
                shortDescription: 'shortDescription',
                content: 'content',
                blogId: '1',
            };

            const response1 = await postTestManager.updatePost(postId, data1,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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

            const response2 = await postTestManager.updatePost(postId, data2,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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

            const response3 = await postTestManager.updatePost(postId, data3,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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

            const response4 = await postTestManager.updatePost(postId, data4,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'title',
                        message: 'Title length must be between 1 and 30 symbols',
                    }
                ],
            });

            await req
                .get(SETTINGS.PATH.POSTS)
                .expect(HTTP_STATUSES.OK_200, createdPosts);
        });

        it(`shouldn't update post if short description is invalid`, async () => {
            const postId = createdPosts[0].id;

            const data1 = {
                title: 'title',
                shortDescription: 24,
                content: 'content',
                blogId: '1',
            };

            const response1 = await postTestManager.updatePost(postId, data1,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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

            const response2 = await postTestManager.updatePost(postId, data2,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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

            const response3 = await postTestManager.updatePost(postId, data3,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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

            const response4 = await postTestManager.updatePost(postId, data4,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'shortDescription',
                        message: 'Short description length must be between 1 and 100 symbols',
                    }
                ],
            });

            await req
                .get(SETTINGS.PATH.POSTS)
                .expect(HTTP_STATUSES.OK_200, createdPosts);
        });

        it(`shouldn't update post if content is invalid`, async () => {
            const postId = createdPosts[0].id;

            const data1 = {
                title: 'title',
                shortDescription: 'shortDescription',
                content: 24,
                blogId: '1',
            };

            const response1 = await postTestManager.updatePost(postId, data1,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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

            const response2 = await postTestManager.updatePost(postId, data2,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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

            const response3 = await postTestManager.updatePost(postId, data3,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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

            const response4 = await postTestManager.updatePost(postId, data4,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'content',
                        message: 'Content length must be between 1 and 1000 symbols',
                    }
                ],
            });

            await req
                .get(SETTINGS.PATH.POSTS)
                .expect(HTTP_STATUSES.OK_200, createdPosts);
        });

        it(`shouldn't update post if blog id is invalid`, async () => {
            const postId = createdPosts[0].id;

            const data1 = {
                title: 'title',
                shortDescription: 'shortDescription',
                content: 'content',
                blogId: 1,
            };

            const response1 = await postTestManager.updatePost(postId, data1,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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

            const response2 = await postTestManager.updatePost(postId, data2,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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

            const response3 = await postTestManager.updatePost(postId, data3,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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

            const response4 = await postTestManager.updatePost(postId, data4,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'blogId',
                        message: 'Blog id does not exist',
                    }
                ],
            });

            await req
                .get(SETTINGS.PATH.POSTS)
                .expect(HTTP_STATUSES.OK_200, createdPosts);
        });

        it(`shouldn't update post if multiple fields are invalid`, async () => {
            const postId = createdPosts[0].id;

            const data = {
                title: 'a'.repeat(31),
                shortDescription: '  ',
                blogId: '-100',
            };

            const response = await postTestManager.updatePost(postId, data,
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
            expect(response.body).toEqual({
                errorsMessages: expect.arrayContaining([
                    { field: 'title', message: 'Title length must be between 1 and 30 symbols' },
                    { field: 'shortDescription', message: 'Short description must not be empty' },
                    { field: 'content', message: 'Content is required' },
                    { field: 'blogId', message: 'Blog id does not exist' },
                ]),
            });

            await req
                .get(SETTINGS.PATH.POSTS)
                .expect(HTTP_STATUSES.OK_200, createdPosts);
        });

        // non-existing post
        it('should return 404 when updating non-existing post', async () => {
            await postTestManager.updatePost('-100', datasets.postsDataForUpdate[0],
                HTTP_STATUSES.NOT_FOUND_404, getValidAuthValue());
        });

        // correct input
        it('should update post if input data is correct', async () => {
            const data = datasets.postsDataForUpdate[0];
            const postId = createdPosts[0].id;

            await postTestManager.updatePost(postId, data,
                HTTP_STATUSES.NO_CONTENT_204, getValidAuthValue());

            await req
                .get(SETTINGS.PATH.POSTS + '/' + createdPosts[1].id)
                .expect(HTTP_STATUSES.OK_200, createdPosts[1]);
        });

        // cannot update deleted post
        it('should return 404 when updating deleted post', async () => {
            const posts = datasets.postsWithDeleted;
            setDB( { posts, blogs: datasets.blogs });

            const data = datasets.postsDataForUpdate[0];
            const postId = posts[1].id;

            await postTestManager.updatePost(postId, data,
                HTTP_STATUSES.NOT_FOUND_404, getValidAuthValue());
        });
    });
});