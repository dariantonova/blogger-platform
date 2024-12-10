import {req} from "./test-helpers";
import {SETTINGS} from "../src/settings";
import {encodeToBase64, HTTP_STATUSES} from "../src/utils";
import {BlogDBType} from "../src/types";
import {db, setDB} from "../src/db/db";
import {getValidAuthValue} from "../src/middlewares/authorization-middleware";
import * as dataset from './dataset';
import {mapBlogToViewModel} from "../src/features/blogs/blogs.controller";
import {CreateBlogInputModel} from "../src/features/blogs/models/CreateBlogInputModel";
import {blogTestManager} from "./blog-test-manager";
import {WEBSITE_URL_PATTERN} from "../src/validation/field-validators/blogs-field-validators";

describe('tests for /blogs', () => {
    beforeAll(async () => {
        await req
            .delete(SETTINGS.PATH.TESTING + '/all-data');
    });

    it('database should be cleared', async () => {
        expect(db.blogs.length).toBe(0);
        expect(db.posts.length).toBe(0);
    });

    describe('get blogs', () => {
        let blogs: BlogDBType[];

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
            blogs = dataset.blogs;
            setDB({ blogs });

            await req
                .get(SETTINGS.PATH.BLOGS)
                .expect(HTTP_STATUSES.OK_200, blogs.map(mapBlogToViewModel));
        });
    });

    describe('get blog', () => {
        let blogs: BlogDBType[];

        beforeAll(() => {
            blogs = dataset.blogs;
            setDB({ blogs });
        });

        afterAll(async () => {
            await req
                .delete(SETTINGS.PATH.TESTING + '/all-data');
        });

        it('should return 404 for non-existing blog', async () => {
            await req
                .get(SETTINGS.PATH.BLOGS + '/-100')
                .expect(HTTP_STATUSES.NOT_FOUND_404);
        });

        it('should return the second blog', async () => {
            await req
                .get(SETTINGS.PATH.BLOGS + '/2')
                .expect(HTTP_STATUSES.OK_200, mapBlogToViewModel(blogs[1]));
        });
    });

    describe('delete blog', () => {
        let blogs: BlogDBType[];

        beforeAll(() => {
            blogs = dataset.blogs;
            setDB({ blogs });
        });

        afterAll(async () => {
            await req
                .delete(SETTINGS.PATH.TESTING + '/all-data');
        });

        it('should forbid deleting blogs for non-admin users', async () => {
            await req
                .delete(SETTINGS.PATH.BLOGS + '/1')
                .expect(HTTP_STATUSES.UNAUTHORIZED_401);

            await req
                .delete(SETTINGS.PATH.BLOGS + '/1')
                .set('Authorization', 'Basic somethingWeird')
                .expect(HTTP_STATUSES.UNAUTHORIZED_401);

            await req
                .delete(SETTINGS.PATH.BLOGS + '/1')
                .set('Authorization', 'Basic ')
                .expect(HTTP_STATUSES.UNAUTHORIZED_401);

            const credentials = SETTINGS.CREDENTIALS.LOGIN + ':' + SETTINGS.CREDENTIALS.PASSWORD;
            await req
                .delete(SETTINGS.PATH.BLOGS + '/1')
                .set('Authorization', `Bearer ${encodeToBase64(credentials)}`)
                .expect(HTTP_STATUSES.UNAUTHORIZED_401);

            await req
                .delete(SETTINGS.PATH.BLOGS + '/1')
                .set('Authorization', encodeToBase64(credentials))
                .expect(HTTP_STATUSES.UNAUTHORIZED_401);

            await req
                .get(SETTINGS.PATH.BLOGS + '/1')
                .expect(HTTP_STATUSES.OK_200, mapBlogToViewModel(blogs[0]));
        });

        it('should return 404 when deleting non-existing blog', async () => {
            await req
                .delete(SETTINGS.PATH.BLOGS + '/-100')
                .set('Authorization', getValidAuthValue())
                .expect(HTTP_STATUSES.NOT_FOUND_404);
        });

        it('should delete the first blog', async () => {
            await req
                .delete(SETTINGS.PATH.BLOGS + '/1')
                .set('Authorization', getValidAuthValue())
                .expect(HTTP_STATUSES.NO_CONTENT_204);

            await req
                .get(SETTINGS.PATH.BLOGS + '/1')
                .expect(HTTP_STATUSES.NOT_FOUND_404);

            await req
                .get(SETTINGS.PATH.BLOGS + '/2')
                .expect(HTTP_STATUSES.OK_200, mapBlogToViewModel(blogs[1]));
        });

        it('should delete the second blog', async () => {
            await req
                .delete(SETTINGS.PATH.BLOGS + '/2')
                .set('Authorization', getValidAuthValue())
                .expect(HTTP_STATUSES.NO_CONTENT_204);

            await req
                .get(SETTINGS.PATH.BLOGS + '/2')
                .expect(HTTP_STATUSES.NOT_FOUND_404);

            await req
                .get(SETTINGS.PATH.BLOGS)
                .expect(HTTP_STATUSES.OK_200, []);
        });
    });

    describe('create blog', () => {
        afterAll(async () => {
            await req
                .delete(SETTINGS.PATH.TESTING + '/all-data');
        });

        // authorization
        it('should forbid creating blogs for non-admin users', async () => {
            const data: CreateBlogInputModel = dataset.blogs[0];

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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                    HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
                HTTP_STATUSES.BAD_REQUEST_400, getValidAuthValue());
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
            const datasetBlog = dataset.blogs[0];
            const data: CreateBlogInputModel = {
                name: datasetBlog.name,
                description: datasetBlog.description,
                websiteUrl: datasetBlog.websiteUrl,
            };

            await blogTestManager.createBlog(data, HTTP_STATUSES.CREATED_201, getValidAuthValue());
        });
    });
});