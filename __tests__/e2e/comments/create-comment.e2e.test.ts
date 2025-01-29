import {MongoMemoryServer} from "mongodb-memory-server";
import {client, runDb, setDb} from "../../../src/db/db";
import {req} from "../../test-helpers";
import {SETTINGS} from "../../../src/settings";
import {BlogDBType, PostDBType} from "../../../src/types/types";
import {CreateUserInputModel} from "../../../src/features/users/models/CreateUserInputModel";
import {userTestManager} from "../../test-managers/user-test-manager";
import {HTTP_STATUSES} from "../../../src/utils";
import {LoginInputModel} from "../../../src/features/auth/types/auth.types";
import {authTestManager} from "../../test-managers/auth-test-manager";
import {CommentDBType, CommentViewModel, CreateCommentInputModel} from "../../../src/features/comments/comments.types";
import {validCommentFieldInput} from "../../datasets/validation/comments-validation-data";
import {postTestManager} from "../../test-managers/post-test-manager";


describe('tests for create comments endpoint', () => {
    let server: MongoMemoryServer;
    let initialDbBlogs: BlogDBType[];
    let initialDbPosts: PostDBType[];
    let createUsersData: CreateUserInputModel[];
    let createdUserIds: string[];

    beforeAll(async () => {
        server = await MongoMemoryServer.create();
        const uri = server.getUri();

        const res = await runDb(uri);
        expect(res).toBe(true);

        await req
            .delete(SETTINGS.PATH.TESTING + '/all-data');

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
        ];

        initialDbPosts = [
            {
                id: '1',
                title: 'post 1',
                shortDescription: 'superpost 1',
                content: 'content of superpost 1',
                blogId: '1',
                blogName: 'blog 1',
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
                isDeleted: true,
                createdAt: '2024-12-16T05:32:26.882Z',
            },
        ];

        await setDb({ blogs: initialDbBlogs, posts: initialDbPosts });
    });

    afterAll(async () => {
        await client.close();
        await server.stop();
    });

    beforeEach(async () => {
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
        ];

        initialDbPosts = [
            {
                id: '1',
                title: 'post 1',
                shortDescription: 'superpost 1',
                content: 'content of superpost 1',
                blogId: '1',
                blogName: 'blog 1',
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
                isDeleted: true,
                createdAt: '2024-12-16T05:32:26.882Z',
            },
        ];

        await setDb({ blogs: initialDbBlogs, posts: initialDbPosts });

        createUsersData = [
            {
                login: 'user1',
                email: 'user1@example.com',
                password: 'qwerty',
            },
        ];

        createdUserIds = [];
        for (const createUserData of createUsersData) {
            const createUserResponse = await userTestManager.createUser(createUserData,
                HTTP_STATUSES.CREATED_201);
            createdUserIds.push(createUserResponse.body.id);
        }
    });

    afterEach(async () => {
        await req
            .delete(SETTINGS.PATH.TESTING + '/all-data');
    });

    const getAccessTokenForUser = async (userIndex: number) => {
        const loginData: LoginInputModel = {
            loginOrEmail: createUsersData[userIndex].login,
            password: createUsersData[userIndex].password,
        };
        const loginResponse = await authTestManager.login(loginData, HTTP_STATUSES.OK_200);
        return loginResponse.body.accessToken;
    };

    // auth problems
    // - no auth
    it('should return 401 if authorization header is not present', async () => {
        const postId = initialDbPosts[0].id;
        const data: CreateCommentInputModel = {
            content: validCommentFieldInput.content,
        };

        await req
            .post(SETTINGS.PATH.POSTS + '/' + postId + '/comments')
            .send(data)
            .expect(HTTP_STATUSES.UNAUTHORIZED_401);

        await postTestManager.checkPostCommentsQuantity(postId, 0);
    });

    // - invalid token
    it('should return 401 if access token is invalid', async () => {
        const postId = initialDbPosts[0].id;
        const data: CreateCommentInputModel = {
            content: validCommentFieldInput.content,
        };

        // never existed, weird
        await postTestManager.createPostComment(postId, data,
            'Bearer somethingWeird',
            HTTP_STATUSES.UNAUTHORIZED_401);

        // existed, but user was deleted
        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        await userTestManager.deleteUser(createdUserIds[userIndex],
            HTTP_STATUSES.NO_CONTENT_204);

        await postTestManager.createPostComment(postId, data,
            'Bearer ' + token,
            HTTP_STATUSES.UNAUTHORIZED_401);

        await postTestManager.checkPostCommentsQuantity(postId, 0);
    });

    // - expired token
    const timeout = async (ms: number) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    it('should return 401 if token is expired', async () => {
        const postId = initialDbPosts[0].id;
        const data: CreateCommentInputModel = {
            content: validCommentFieldInput.content,
        };

        SETTINGS.ACCESS_JWT_LIFE = '10ms';
        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        await timeout(10);

        await postTestManager.createPostComment(postId, data,
            'Bearer ' + token,
            HTTP_STATUSES.UNAUTHORIZED_401);

        await postTestManager.checkPostCommentsQuantity(postId, 0);

        SETTINGS.ACCESS_JWT_LIFE = '7d';
    });

    // - invalid auth format
    it('should return 401 if auth header format is invalid', async () => {
        const postId = initialDbPosts[0].id;
        const data: CreateCommentInputModel = {
            content: validCommentFieldInput.content,
        };

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        await postTestManager.createPostComment(postId, data,
            token,
            HTTP_STATUSES.UNAUTHORIZED_401);

        await postTestManager.createPostComment(postId, data,
            token + ' Bearer',
            HTTP_STATUSES.UNAUTHORIZED_401);

        await postTestManager.checkPostCommentsQuantity(postId, 0);
    });

    // validation
    // - invalid content
    it(`shouldn't create comment if required fields are missing`, async () => {
        const postId = initialDbPosts[0].id;
        const data = {};

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const response = await postTestManager.createPostComment(postId, data,
            'Bearer ' + token,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response.body).toEqual({
            errorsMessages: [
                {
                    field: 'content',
                    message: 'Content is required',
                }
            ],
        });

        await postTestManager.checkPostCommentsQuantity(postId, 0);
    });

    it(`shouldn't create comment if content is invalid`, async () => {
        const postId = initialDbPosts[0].id;

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        // not string
        const data1 = {
            content: 4,
        };

        const response1 = await postTestManager.createPostComment(postId, data1,
            'Bearer ' + token,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response1.body).toEqual({
            errorsMessages: [
                {
                    field: 'content',
                    message: 'Content must be a string',
                }
            ],
        });

        // empty string
        const data2 = {
            content: '',
        };

        const response2 = await postTestManager.createPostComment(postId, data2,
            'Bearer ' + token,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response2.body).toEqual({
            errorsMessages: [
                {
                    field: 'content',
                    message: 'Content must not be empty',
                }
            ],
        });

        // empty string with spaces
        const data3 = {
            content: '  ',
        };

        const response3 = await postTestManager.createPostComment(postId, data3,
            'Bearer ' + token,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response3.body).toEqual({
            errorsMessages: [
                {
                    field: 'content',
                    message: 'Content must not be empty',
                }
            ],
        });

        // too short
        const data4 = {
            content: 'a'.repeat(19),
        };

        const response4 = await postTestManager.createPostComment(postId, data4,
            'Bearer ' + token,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response4.body).toEqual({
            errorsMessages: [
                {
                    field: 'content',
                    message: 'Content must be between 6 and 300 characters long',
                }
            ],
        });

        // too long
        const data5 = {
            content: 'a'.repeat(301),
        };

        const response5 = await postTestManager.createPostComment(postId, data5,
            'Bearer ' + token,
            HTTP_STATUSES.BAD_REQUEST_400);
        expect(response5.body).toEqual({
            errorsMessages: [
                {
                    field: 'content',
                    message: 'Content must be between 6 and 300 characters long',
                }
            ],
        });

        await postTestManager.checkPostCommentsQuantity(postId, 0);
    });

    // non-existing post
    it(`shouldn't create comment of non-existing post`, async () => {
        const data: CreateCommentInputModel = {
            content: validCommentFieldInput.content,
        };

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        await postTestManager.createPostComment('-100', data,
            'Bearer ' + token,
            HTTP_STATUSES.NOT_FOUND_404);

        // deleted
        const postId = initialDbPosts[1].id;
        await postTestManager.createPostComment(postId, data,
            'Bearer ' + token,
            HTTP_STATUSES.NOT_FOUND_404);
    });

    // successful create (2 times)
    it('should create comment', async () => {
        const postId = initialDbPosts[0].id;
        const data: CreateCommentInputModel = {
            content: 'The very first comment.',
        };

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const response = await postTestManager.createPostComment(postId, data,
            'Bearer ' + token,
            HTTP_STATUSES.CREATED_201);

        const createdComment: CommentViewModel = response.body;
        expect(createdComment.id).toEqual(expect.any(String));
        expect(createdComment.content).toBe(data.content);
        expect(createdComment.commentatorInfo.userId).toBe(createdUserIds[userIndex]);
        expect(createdComment.commentatorInfo.userLogin).toBe(createUsersData[userIndex].login);
        expect(createdComment.createdAt).toEqual(expect.any(String));
        expect(new Date(createdComment.createdAt).getTime()).not.toBeNaN();

        const getCommentsResponse = await postTestManager.getPostComments(postId, HTTP_STATUSES.OK_200);
        expect(getCommentsResponse.body.items).toEqual([createdComment]);
    });

    it('should create one more comment', async () => {
        const initialDbComments: CommentDBType[] = [
            {
                content: 'The very first comment.',
                postId: initialDbPosts[0].id,
                commentatorInfo: {
                    userId: '1',
                    userLogin: 'user',
                },
                createdAt: '2024-12-16T05:32:26.882Z',
                isDeleted: false,
            },
        ];
        await setDb({ comments: initialDbComments });

        const postId = initialDbPosts[0].id;

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const data: CreateCommentInputModel = {
            content: 'Another comment. Wow!',
        };
        const response = await postTestManager.createPostComment(postId, data,
            'Bearer ' + token,
            HTTP_STATUSES.CREATED_201);

        const createdComment: CommentViewModel = response.body;
        expect(createdComment.id).toEqual(expect.any(String));
        expect(createdComment.content).toBe(data.content);
        expect(createdComment.commentatorInfo.userId).toBe(createdUserIds[userIndex]);
        expect(createdComment.commentatorInfo.userLogin).toBe(createUsersData[userIndex].login);
        expect(createdComment.createdAt).toEqual(expect.any(String));
        expect(new Date(createdComment.createdAt).getTime()).not.toBeNaN();

        await req
            .get(SETTINGS.PATH.COMMENTS + '/' + createdComment.id)
            .expect(HTTP_STATUSES.OK_200, createdComment);

        await postTestManager.checkPostCommentsQuantity(postId, 2);
    });
});