import {MongoMemoryServer} from "mongodb-memory-server";
import {BlogDBType, PostDBType} from "../../../src/types/types";
import {CreateUserInputModel} from "../../../src/features/users/models/CreateUserInputModel";
import {ObjectId, WithId} from "mongodb";
import {CommentDBType, CommentViewModel, UpdateCommentInputModel} from "../../../src/features/comments/comments.types";
import {client, runDb, setDb} from "../../../src/db/db";
import {req} from "../../test-helpers";
import {SETTINGS} from "../../../src/settings";
import {usersTestManager} from "../../test-managers/users-test-manager";
import {HTTP_STATUSES} from "../../../src/utils";
import {LoginInputModel} from "../../../src/features/auth/types/auth.types";
import {authTestManager} from "../../test-managers/auth-test-manager";
import {validCommentFieldInput} from "../../datasets/validation/comments-validation-data";
import {commentsTestManager} from "../../test-managers/comments-test-manager";
import {defaultAccessTokenLife} from "../../datasets/authorization-data";
import mongoose from "mongoose";


describe('tests for update comment endpoint', () => {
    let server: MongoMemoryServer;
    let initialDbBlogs: BlogDBType[];
    let initialDbPosts: PostDBType[];
    let createUsersData: CreateUserInputModel[];
    let createdUserIds: string[];
    let initialDbComments: WithId<CommentDBType>[];

    beforeAll(async () => {
        server = await MongoMemoryServer.create();
        const uri = server.getUri();

        const res = await runDb(uri);
        expect(res).toBe(true);

        await req
            .delete(SETTINGS.PATH.TESTING + '/all-data');
    });

    afterAll(async () => {
        await mongoose.connection.close();
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
            const createUserResponse = await usersTestManager.createUser(createUserData,
                HTTP_STATUSES.CREATED_201);
            createdUserIds.push(createUserResponse.body.id);
        }

        initialDbComments = [
            {
                _id: new ObjectId(),
                content: 'The very first comment.',
                postId: initialDbPosts[0].id,
                commentatorInfo: {
                    userId: createdUserIds[0],
                    userLogin: createUsersData[0].login,
                },
                likesInfo: {
                    likesCount: 0,
                    dislikesCount: 0,
                },
                createdAt: '2024-12-16T05:32:26.882Z',
                isDeleted: false,
            },
            {
                _id: new ObjectId(),
                content: 'Another comment. Wow!',
                postId: initialDbPosts[0].id,
                commentatorInfo: {
                    userId: createdUserIds[0],
                    userLogin: createUsersData[0].login,
                },
                likesInfo: {
                    likesCount: 0,
                    dislikesCount: 0,
                },
                createdAt: '2024-12-16T05:32:26.882Z',
                isDeleted: true,
            },
            {
                _id: new ObjectId(),
                content: 'Comment number 3. Wow!',
                postId: initialDbPosts[0].id,
                commentatorInfo: {
                    userId: createdUserIds[0],
                    userLogin: createUsersData[0].login,
                },
                likesInfo: {
                    likesCount: 0,
                    dislikesCount: 0,
                },
                createdAt: '2024-12-16T05:32:26.882Z',
                isDeleted: false,
            },
        ];
        await setDb({ comments: initialDbComments });
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
        const commentToUpdate = initialDbComments[0];
        const commentId = commentToUpdate._id.toString();
        const data: UpdateCommentInputModel = {
            content: validCommentFieldInput.content,
        };

        await req
            .put(SETTINGS.PATH.COMMENTS + '/' + commentId)
            .send(data)
            .expect(HTTP_STATUSES.UNAUTHORIZED_401);

        await commentsTestManager.checkCommentIsTheSame(commentToUpdate);
    });

    // - invalid token
    it('should return 401 if access token is invalid', async () => {
        const commentToUpdate = initialDbComments[0];
        const commentId = commentToUpdate._id.toString();
        const data: UpdateCommentInputModel = {
            content: validCommentFieldInput.content,
        };

        // never existed, weird
        await commentsTestManager.updateComment(commentId, data,
            'Bearer somethingWeird',
            HTTP_STATUSES.UNAUTHORIZED_401);

        // existed, but user was deleted
        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        await usersTestManager.deleteUser(createdUserIds[userIndex],
            HTTP_STATUSES.NO_CONTENT_204);

        await commentsTestManager.updateComment(commentId, data,
            'Bearer ' + token,
            HTTP_STATUSES.UNAUTHORIZED_401);

        await commentsTestManager.checkCommentIsTheSame(commentToUpdate);
    });

    // - expired token
    it('should return 401 if token is expired', async () => {
        const commentToUpdate = initialDbComments[0];
        const commentId = commentToUpdate._id.toString();
        const data: UpdateCommentInputModel = {
            content: validCommentFieldInput.content,
        };

        SETTINGS.ACCESS_JWT_LIFE = '0';
        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        await commentsTestManager.updateComment(commentId, data,
            'Bearer ' + token,
            HTTP_STATUSES.UNAUTHORIZED_401);

        await commentsTestManager.checkCommentIsTheSame(commentToUpdate);

        SETTINGS.ACCESS_JWT_LIFE = defaultAccessTokenLife;
    });

    // - invalid auth format
    it('should return 401 if auth header format is invalid', async () => {
        const commentToUpdate = initialDbComments[0];
        const commentId = commentToUpdate._id.toString();
        const data: UpdateCommentInputModel = {
            content: validCommentFieldInput.content,
        };

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        await commentsTestManager.updateComment(commentId, data,
            token,
            HTTP_STATUSES.UNAUTHORIZED_401);

        await commentsTestManager.updateComment(commentId, data,
            token + ' Bearer',
            HTTP_STATUSES.UNAUTHORIZED_401);

        await commentsTestManager.checkCommentIsTheSame(commentToUpdate);
    });

    it('should return 403 when user is trying to update a comment that is not their own',
        async () => {
        const createNewUserData = {
            login: 'user2',
            email: 'user2@example.com',
            password: 'qwerty1234',
        };
        createUsersData.push(createNewUserData);

        const createUserResponse = await usersTestManager.createUser(createNewUserData,
            HTTP_STATUSES.CREATED_201);
        createdUserIds.push(createUserResponse.body.id);

        const userIndex = 1;
        const token = await getAccessTokenForUser(userIndex);

        const commentToUpdate = initialDbComments[0];
        const commentId = commentToUpdate._id.toString();
        const data: UpdateCommentInputModel = {
            content: validCommentFieldInput.content,
        };

        await commentsTestManager.updateComment(commentId, data,
            'Bearer ' + token,
            HTTP_STATUSES.FORBIDDEN_403);

        await commentsTestManager.checkCommentIsTheSame(commentToUpdate);
    });

    it('should return 404 when deleting non-existing comment', async () => {
        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const data: UpdateCommentInputModel = {
            content: validCommentFieldInput.content,
        };

        await commentsTestManager.updateComment('-100', data,
            'Bearer ' + token,
            HTTP_STATUSES.NOT_FOUND_404);

        // deleted
        const commentToUpdate = initialDbComments[1];
        const commentId = commentToUpdate._id.toString();
        await commentsTestManager.updateComment(commentId, data,
            'Bearer ' + token,
            HTTP_STATUSES.NOT_FOUND_404);
    });

    // validation
    // - invalid content
    it(`shouldn't create comment if required fields are missing`, async () => {
        const commentToUpdate = initialDbComments[0];
        const commentId = commentToUpdate._id.toString();
        const data = {};

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const response = await commentsTestManager.updateComment(commentId, data,
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

        await commentsTestManager.checkCommentIsTheSame(commentToUpdate);
    });

    it(`shouldn't create comment if content is invalid`, async () => {
        const commentToUpdate = initialDbComments[0];
        const commentId = commentToUpdate._id.toString();

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        // not string
        const data1 = {
            content: 4,
        };

        const response1 = await commentsTestManager.updateComment(commentId, data1,
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

        const response2 = await commentsTestManager.updateComment(commentId, data2,
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

        const response3 = await commentsTestManager.updateComment(commentId, data3,
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

        const response4 = await commentsTestManager.updateComment(commentId, data4,
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

        const response5 = await commentsTestManager.updateComment(commentId, data5,
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

        await commentsTestManager.checkCommentIsTheSame(commentToUpdate);
    });

    // successful update
    it('should update the first comment', async () => {
        const dbCommentToUpdate = initialDbComments[0];
        const commentId = dbCommentToUpdate._id.toString();
        const data = {
            content: validCommentFieldInput.content,
        };

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        await commentsTestManager.updateComment(commentId, data,
            'Bearer ' + token,
            HTTP_STATUSES.NO_CONTENT_204);

        const getCommentResponse = await req
            .get(SETTINGS.PATH.COMMENTS + '/' + commentId)
            .expect(HTTP_STATUSES.OK_200);
        const updatedComment: CommentViewModel = getCommentResponse.body;

        expect(updatedComment.content).toBe(data.content);
        expect(updatedComment.commentatorInfo).toEqual(dbCommentToUpdate.commentatorInfo);
        expect(updatedComment.createdAt).toEqual(dbCommentToUpdate.createdAt);
    });
});