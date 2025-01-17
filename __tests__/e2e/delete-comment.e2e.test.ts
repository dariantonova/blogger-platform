import {MongoMemoryServer} from "mongodb-memory-server";
import {BlogDBType, PostDBType} from "../../src/types/types";
import {CreateUserInputModel} from "../../src/features/users/models/CreateUserInputModel";
import {ObjectId, WithId} from "mongodb";
import {CommentDBType} from "../../src/features/comments/comments.types";
import {client, runDb, setDb} from "../../src/db/db";
import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {userTestManager} from "../test-managers/user-test-manager";
import {HTTP_STATUSES} from "../../src/utils";
import {commentTestManager} from "../test-managers/comment-test-manager";
import {LoginInputModel} from "../../src/features/auth/types/auth.types";
import {authTestManager} from "../test-managers/auth-test-manager";
import {jwtSignOptions} from "../../src/application/jwt.service";
import {postTestManager} from "../test-managers/post-test-manager";

describe('tests for delete comment endpoint', () => {
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
            const createUserResponse = await userTestManager.createUser(createUserData,
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
        const commentId = initialDbComments[0]._id.toString();
        await req
            .delete(SETTINGS.PATH.COMMENTS + '/' + commentId)
            .expect(HTTP_STATUSES.UNAUTHORIZED_401);

        await req
            .get(SETTINGS.PATH.COMMENTS + '/' + commentId)
            .expect(HTTP_STATUSES.OK_200);
    });

    // - invalid token
    it('should return 401 if access token is invalid', async () => {
        const commentId = initialDbComments[0]._id.toString();

        // never existed, weird
        await commentTestManager.deleteComment(commentId,
            'Bearer somethingWeird',
            HTTP_STATUSES.UNAUTHORIZED_401);

        // existed, but user was deleted
        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        await userTestManager.deleteUser(createdUserIds[userIndex],
            HTTP_STATUSES.NO_CONTENT_204);

        await commentTestManager.deleteComment(commentId,
            'Bearer ' + token,
            HTTP_STATUSES.UNAUTHORIZED_401);

        await req
            .get(SETTINGS.PATH.COMMENTS + '/' + commentId)
            .expect(HTTP_STATUSES.OK_200);
    });

    // - expired token
    const timeout = async (ms: number) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    it('should return 401 if token is expired', async () => {
        const commentId = initialDbComments[0]._id.toString();

        jwtSignOptions.expiresIn = '10ms';
        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        await timeout(10);

        await commentTestManager.deleteComment(commentId,
            'Bearer ' + token,
            HTTP_STATUSES.UNAUTHORIZED_401);

        await req
            .get(SETTINGS.PATH.COMMENTS + '/' + commentId)
            .expect(HTTP_STATUSES.OK_200);

        jwtSignOptions.expiresIn = '7d';
    });

    // - invalid auth format
    it('should return 401 if auth header format is invalid', async () => {
        const commentId = initialDbComments[0]._id.toString();

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        await commentTestManager.deleteComment(commentId,
            token,
            HTTP_STATUSES.UNAUTHORIZED_401);

        await commentTestManager.deleteComment(commentId,
            token + ' Bearer',
            HTTP_STATUSES.UNAUTHORIZED_401);

        await req
            .get(SETTINGS.PATH.COMMENTS + '/' + commentId)
            .expect(HTTP_STATUSES.OK_200);
    });

    it('should return 403 when user is trying to delete a comment that is not their own',
        async () => {
        const createNewUserData = {
            login: 'user2',
            email: 'user2@example.com',
            password: 'qwerty1234',
        };
        createUsersData.push(createNewUserData);

        const createUserResponse = await userTestManager.createUser(createNewUserData,
            HTTP_STATUSES.CREATED_201);
        createdUserIds.push(createUserResponse.body.id);

        const userIndex = 1;
        const token = await getAccessTokenForUser(userIndex);

        const commentId = initialDbComments[0]._id.toString();
        await commentTestManager.deleteComment(commentId,
            'Bearer ' + token,
            HTTP_STATUSES.FORBIDDEN_403);

        await req
            .get(SETTINGS.PATH.COMMENTS + '/' + commentId)
            .expect(HTTP_STATUSES.OK_200);
    });

    it('should return 404 when deleting non-existing comment', async () => {
        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        // deleted
        const commentId = initialDbComments[1]._id.toString();
        await commentTestManager.deleteComment(commentId,
            'Bearer ' + token,
            HTTP_STATUSES.NOT_FOUND_404);

        await commentTestManager.deleteComment('-100',
            'Bearer ' + token,
            HTTP_STATUSES.NOT_FOUND_404);
    });

    it('should delete the first comment', async () => {
        const commentId = initialDbComments[0]._id.toString();

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        await commentTestManager.deleteComment(commentId,
            'Bearer ' + token,
            HTTP_STATUSES.NO_CONTENT_204);

        await req
            .get(SETTINGS.PATH.COMMENTS + '/' + commentId)
            .expect(HTTP_STATUSES.NOT_FOUND_404);

        const getPostsResponse = await postTestManager.getPostComments(
            initialDbPosts[0].id, HTTP_STATUSES.OK_200);
        expect(getPostsResponse.body.items.length).toBe(
            initialDbComments.filter(c => !c.isDeleted).length - 1);
    });
});