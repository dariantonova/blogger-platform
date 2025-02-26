import {MongoMemoryServer} from "mongodb-memory-server";
import {BlogDBType, LikeStatusEnum, PostDBType} from "../../../src/types/types";
import {CreateUserInputModel} from "../../../src/features/users/models/CreateUserInputModel";
import {client, runDb, setDb} from "../../../src/db/db";
import {requestsLimit} from "../../../src/middlewares/rate-limiting-middleware";
import {usersTestManager} from "../../test-managers/users-test-manager";
import {HTTP_STATUSES} from "../../../src/utils";
import mongoose from "mongoose";
import {LoginInputModel} from "../../../src/features/auth/types/auth.types";
import {authTestManager} from "../../test-managers/auth-test-manager";
import {LikeDetailsViewModel, LikeInputModel} from "../../../src/features/likes/likes.types";
import {req} from "../../test-helpers";
import {SETTINGS} from "../../../src/settings";
import {defaultAccessTokenLife} from "../../datasets/authorization-data";
import {postsTestManager} from "../../test-managers/posts-test-manager";
import {CreatePostInputModel} from "../../../src/features/posts/models/CreatePostInputModel";
import {PostViewModel} from "../../../src/features/posts/models/PostViewModel";

describe('tests for post likes', () => {
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

        requestsLimit.numberOfAttemptsLimit = 1000;
        requestsLimit.intervalMs = 1000;

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
                extendedLikesInfo: {
                    likesCount: 0,
                    dislikesCount: 0,
                    newestLikes: [],
                },
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
                extendedLikesInfo: {
                    likesCount: 0,
                    dislikesCount: 0,
                    newestLikes: [],
                },
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
                extendedLikesInfo: {
                    likesCount: 0,
                    dislikesCount: 0,
                    newestLikes: [],
                },
            },
        ];

        // user 3 is to be deleted
        createUsersData = [
            {
                login: 'user1',
                email: 'user1@example.com',
                password: 'qwerty',
            },
            {
                login: 'user2',
                email: 'user2@example.com',
                password: 'qwerty',
            },
            {
                login: 'user3',
                email: 'user3@example.com',
                password: 'qwerty',
            },
        ];

        createdUserIds = [];
        for (const createUserData of createUsersData) {
            const createUserResponse = await usersTestManager.createUser(createUserData,
                HTTP_STATUSES.CREATED_201);
            createdUserIds.push(createUserResponse.body.id);
        }

        await setDb({ blogs: initialDbBlogs, posts: initialDbPosts });
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await client.close();
        await server.stop();
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
        const data: LikeInputModel = { likeStatus: LikeStatusEnum.like };

        await req
            .put(SETTINGS.PATH.POSTS + '/' + postId + '/like-status')
            .send(data)
            .expect(HTTP_STATUSES.UNAUTHORIZED_401);

        await postsTestManager.checkPostLikesCount(postId, 0);
    });

    // - invalid token
    it('should return 401 if access token is invalid', async () => {
        const postId = initialDbPosts[0].id;
        const data: LikeInputModel = { likeStatus: LikeStatusEnum.like };

        // never existed, weird
        await postsTestManager.updatePostLikeStatus(postId, data,
            'Bearer somethingWeird',
            HTTP_STATUSES.UNAUTHORIZED_401);

        // existed, but user was deleted
        const userIndex = 2;
        const token = await getAccessTokenForUser(userIndex);

        await usersTestManager.deleteUser(createdUserIds[userIndex],
            HTTP_STATUSES.NO_CONTENT_204);

        await postsTestManager.updatePostLikeStatus(postId, data,
            'Bearer ' + token,
            HTTP_STATUSES.UNAUTHORIZED_401);

        await postsTestManager.checkPostLikesCount(postId, 0);
    });

    // - expired token
    it('should return 401 if token is expired', async () => {
        const postId = initialDbPosts[0].id;
        const data: LikeInputModel = { likeStatus: LikeStatusEnum.like };

        SETTINGS.ACCESS_JWT_LIFE = '0';
        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        await postsTestManager.updatePostLikeStatus(postId, data,
            'Bearer ' + token,
            HTTP_STATUSES.UNAUTHORIZED_401);

        await postsTestManager.checkPostLikesCount(postId, 0);

        SETTINGS.ACCESS_JWT_LIFE = defaultAccessTokenLife;
    });

    // - invalid auth format
    it('should return 401 if auth header format is invalid', async () => {
        const postId = initialDbPosts[0].id;
        const data: LikeInputModel = { likeStatus: LikeStatusEnum.like };

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        await postsTestManager.updatePostLikeStatus(postId, data,
            token,
            HTTP_STATUSES.UNAUTHORIZED_401);

        await postsTestManager.updatePostLikeStatus(postId, data,
            token + ' Bearer',
            HTTP_STATUSES.UNAUTHORIZED_401);

        await postsTestManager.checkPostLikesCount(postId, 0);
    });

    it('should return 400 if like status is invalid', async () => {
        const postId = initialDbPosts[0].id;

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const data = { likeStatus: '-100' };

        await postsTestManager.updatePostLikeStatus(postId, data,
            'Bearer ' + token,
            HTTP_STATUSES.BAD_REQUEST_400);

        const getPostResponse = await postsTestManager.getPost(postId, HTTP_STATUSES.OK_200);
        expect(getPostResponse.body.extendedLikesInfo.likesCount).toBe(0);
        expect(getPostResponse.body.extendedLikesInfo.dislikesCount).toBe(0);
    });

    it(`should return 404 if post doesn't exist`, async () => {
        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const data: LikeInputModel = { likeStatus: LikeStatusEnum.like };

        // non-existing
        let postId = '-1';
        await postsTestManager.updatePostLikeStatus(postId, data,
            'Bearer ' + token,
            HTTP_STATUSES.NOT_FOUND_404);

        // deleted
        postId = initialDbPosts[2].id;
        await postsTestManager.updatePostLikeStatus(postId, data,
            'Bearer ' + token,
            HTTP_STATUSES.NOT_FOUND_404);
    });

    it('should like post', async () => {
        const postId = initialDbPosts[0].id;

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const data: LikeInputModel = { likeStatus: LikeStatusEnum.like };

        await postsTestManager.updatePostLikeStatus(postId, data,
            'Bearer ' + token,
            HTTP_STATUSES.NO_CONTENT_204);

        const getPostResponse = await postsTestManager.getPost(postId,
            HTTP_STATUSES.OK_200, 'Bearer ' + token);
        expect(getPostResponse.body.extendedLikesInfo.likesCount).toBe(1);
        expect(getPostResponse.body.extendedLikesInfo.dislikesCount).toBe(0);
        expect(getPostResponse.body.extendedLikesInfo.myStatus).toBe(LikeStatusEnum.like);
    });

    it(`shouldn't like post multiple times by one user`, async () => {
        const postId = initialDbPosts[0].id;

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const data: LikeInputModel = { likeStatus: LikeStatusEnum.like };

        await postsTestManager.updatePostLikeStatus(postId, data,
            'Bearer ' + token,
            HTTP_STATUSES.NO_CONTENT_204);

        const getPostResponse = await postsTestManager.getPost(postId,
            HTTP_STATUSES.OK_200, 'Bearer ' + token);
        expect(getPostResponse.body.extendedLikesInfo.likesCount).toBe(1);
        expect(getPostResponse.body.extendedLikesInfo.dislikesCount).toBe(0);
        expect(getPostResponse.body.extendedLikesInfo.myStatus).toBe(LikeStatusEnum.like);
    });

    it(`should replace like with dislike`, async () => {
        const postId = initialDbPosts[0].id;

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const data: LikeInputModel = { likeStatus: LikeStatusEnum.dislike };

        await postsTestManager.updatePostLikeStatus(postId, data,
            'Bearer ' + token,
            HTTP_STATUSES.NO_CONTENT_204);

        const getPostResponse = await postsTestManager.getPost(postId,
            HTTP_STATUSES.OK_200, 'Bearer ' + token);
        expect(getPostResponse.body.extendedLikesInfo.likesCount).toBe(0);
        expect(getPostResponse.body.extendedLikesInfo.dislikesCount).toBe(1);
        expect(getPostResponse.body.extendedLikesInfo.myStatus).toBe(LikeStatusEnum.dislike);
    });

    it(`shouldn't dislike post multiple times by one user`, async () => {
        const postId = initialDbPosts[0].id;

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const data: LikeInputModel = { likeStatus: LikeStatusEnum.dislike };

        await postsTestManager.updatePostLikeStatus(postId, data,
            'Bearer ' + token,
            HTTP_STATUSES.NO_CONTENT_204);

        const getPostResponse = await postsTestManager.getPost(postId,
            HTTP_STATUSES.OK_200, 'Bearer ' + token);
        expect(getPostResponse.body.extendedLikesInfo.likesCount).toBe(0);
        expect(getPostResponse.body.extendedLikesInfo.dislikesCount).toBe(1);
        expect(getPostResponse.body.extendedLikesInfo.myStatus).toBe(LikeStatusEnum.dislike);
    });

    it(`should undislike post`, async () => {
        const postId = initialDbPosts[0].id;

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const data: LikeInputModel = { likeStatus: LikeStatusEnum.none };

        await postsTestManager.updatePostLikeStatus(postId, data,
            'Bearer ' + token,
            HTTP_STATUSES.NO_CONTENT_204);

        const getPostResponse = await postsTestManager.getPost(postId,
            HTTP_STATUSES.OK_200, 'Bearer ' + token);
        expect(getPostResponse.body.extendedLikesInfo.likesCount).toBe(0);
        expect(getPostResponse.body.extendedLikesInfo.dislikesCount).toBe(0);
        expect(getPostResponse.body.extendedLikesInfo.myStatus).toBe(LikeStatusEnum.none);
    });

    it(`should do nothing when removing non-existing like or dislike`, async () => {
        const postId = initialDbPosts[0].id;

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const data: LikeInputModel = { likeStatus: LikeStatusEnum.none };

        await postsTestManager.updatePostLikeStatus(postId, data,
            'Bearer ' + token,
            HTTP_STATUSES.NO_CONTENT_204);

        const getPostResponse = await postsTestManager.getPost(postId,
            HTTP_STATUSES.OK_200, 'Bearer ' + token);
        expect(getPostResponse.body.extendedLikesInfo.likesCount).toBe(0);
        expect(getPostResponse.body.extendedLikesInfo.dislikesCount).toBe(0);
        expect(getPostResponse.body.extendedLikesInfo.myStatus).toBe(LikeStatusEnum.none);
    });

    it(`should dislike post`, async () => {
        const postId = initialDbPosts[0].id;

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const data: LikeInputModel = { likeStatus: LikeStatusEnum.dislike };

        await postsTestManager.updatePostLikeStatus(postId, data,
            'Bearer ' + token,
            HTTP_STATUSES.NO_CONTENT_204);

        const getPostResponse = await postsTestManager.getPost(postId,
            HTTP_STATUSES.OK_200, 'Bearer ' + token);
        expect(getPostResponse.body.extendedLikesInfo.likesCount).toBe(0);
        expect(getPostResponse.body.extendedLikesInfo.dislikesCount).toBe(1);
        expect(getPostResponse.body.extendedLikesInfo.myStatus).toBe(LikeStatusEnum.dislike);
    });

    it(`should replace dislike with like`, async () => {
        const postId = initialDbPosts[0].id;

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const data: LikeInputModel = { likeStatus: LikeStatusEnum.like };

        await postsTestManager.updatePostLikeStatus(postId, data,
            'Bearer ' + token,
            HTTP_STATUSES.NO_CONTENT_204);

        const getPostResponse = await postsTestManager.getPost(postId,
            HTTP_STATUSES.OK_200, 'Bearer ' + token);
        expect(getPostResponse.body.extendedLikesInfo.likesCount).toBe(1);
        expect(getPostResponse.body.extendedLikesInfo.dislikesCount).toBe(0);
        expect(getPostResponse.body.extendedLikesInfo.myStatus).toBe(LikeStatusEnum.like);
    });

    it(`should unlike post`, async () => {
        const postId = initialDbPosts[0].id;

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const data: LikeInputModel = { likeStatus: LikeStatusEnum.none };

        await postsTestManager.updatePostLikeStatus(postId, data,
            'Bearer ' + token,
            HTTP_STATUSES.NO_CONTENT_204);

        const getPostResponse = await postsTestManager.getPost(postId,
            HTTP_STATUSES.OK_200, 'Bearer ' + token);
        expect(getPostResponse.body.extendedLikesInfo.likesCount).toBe(0);
        expect(getPostResponse.body.extendedLikesInfo.dislikesCount).toBe(0);
        expect(getPostResponse.body.extendedLikesInfo.myStatus).toBe(LikeStatusEnum.none);
    });

    it(`should like post multiple times by different users`, async () => {
        const postId = initialDbPosts[0].id;

        const data: LikeInputModel = { likeStatus: LikeStatusEnum.like };

        let userIndex = 0;
        const token1 = await getAccessTokenForUser(userIndex);
        userIndex = 1;
        const token2 = await getAccessTokenForUser(userIndex);

        await postsTestManager.updatePostLikeStatus(postId, data,
            'Bearer ' + token1,
            HTTP_STATUSES.NO_CONTENT_204);
        await postsTestManager.updatePostLikeStatus(postId, data,
            'Bearer ' + token2,
            HTTP_STATUSES.NO_CONTENT_204);

        await postsTestManager.checkPostLikesCount(postId, 2);
    });

    it(`should dislike post multiple times by different users`, async () => {
        const postId = initialDbPosts[0].id;

        const data: LikeInputModel = { likeStatus: LikeStatusEnum.dislike };

        let userIndex = 0;
        const token1 = await getAccessTokenForUser(userIndex);
        userIndex = 1;
        const token2 = await getAccessTokenForUser(userIndex);

        await postsTestManager.updatePostLikeStatus(postId, data,
            'Bearer ' + token1,
            HTTP_STATUSES.NO_CONTENT_204);
        await postsTestManager.updatePostLikeStatus(postId, data,
            'Bearer ' + token2,
            HTTP_STATUSES.NO_CONTENT_204);

        await postsTestManager.checkPostDislikesCount(postId, 2);
    });

    it(`should return like status none when getting post by unauthorized user`, async () => {
        const getPostResponse = await postsTestManager.getPost(initialDbPosts[0].id,
            HTTP_STATUSES.OK_200, '');
        expect(getPostResponse.body.extendedLikesInfo.myStatus).toBe(LikeStatusEnum.none);
    });

    it(`should create post with 0 likes and 0 dislikes`, async () => {
        const blogId = initialDbBlogs[0].id;
        const data: CreatePostInputModel = {
            title: 'new post',
            shortDescription: 'new superpost',
            content: 'content of new superpost',
            blogId,
        };
        const createPostResponse = await postsTestManager.createPost(data, HTTP_STATUSES.CREATED_201);
        const createdPostId = createPostResponse.body.id;

        const getPostResponse = await postsTestManager.getPost(createdPostId, HTTP_STATUSES.OK_200);
        expect(getPostResponse.body.extendedLikesInfo.likesCount).toBe(0);
        expect(getPostResponse.body.extendedLikesInfo.dislikesCount).toBe(0);
    });

    it(`should remove user's post likes and dislikes when deleting user`, async () => {
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
                extendedLikesInfo: {
                    likesCount: 0,
                    dislikesCount: 0,
                    newestLikes: [],
                },
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
                extendedLikesInfo: {
                    likesCount: 0,
                    dislikesCount: 0,
                    newestLikes: [],
                },
            }
        ];

        await setDb({ posts: initialDbPosts });

        const userIndex = 1;
        const token = await getAccessTokenForUser(userIndex);

        const postId1 = initialDbPosts[0].id;
        const data1: LikeInputModel = { likeStatus: LikeStatusEnum.like };

        const postId2 = initialDbPosts[1].id;
        const data2: LikeInputModel = { likeStatus: LikeStatusEnum.dislike };

        await postsTestManager.updatePostLikeStatus(postId1, data1,
            'Bearer ' + token,
            HTTP_STATUSES.NO_CONTENT_204);
        await postsTestManager.updatePostLikeStatus(postId2, data2,
            'Bearer ' + token,
            HTTP_STATUSES.NO_CONTENT_204);

        await usersTestManager.deleteUser(createdUserIds[userIndex], HTTP_STATUSES.NO_CONTENT_204);

        const getPost1Response = await postsTestManager.getPost(postId1, HTTP_STATUSES.OK_200);
        expect(getPost1Response.body.extendedLikesInfo.likesCount)
            .toBe(initialDbPosts[0].extendedLikesInfo.likesCount);

        const getPost2Response = await postsTestManager.getPost(postId2, HTTP_STATUSES.OK_200);
        expect(getPost2Response.body.extendedLikesInfo.dislikesCount)
            .toBe(initialDbPosts[1].extendedLikesInfo.dislikesCount);
    });

    describe('tests for newest likes', () => {
        beforeAll(async () => {
            await setDb();

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
                    extendedLikesInfo: {
                        likesCount: 0,
                        dislikesCount: 0,
                        newestLikes: [],
                    },
                },
            ];

            createUsersData = [
                {
                    login: 'user1',
                    email: 'user1@example.com',
                    password: 'qwerty',
                },
                {
                    login: 'user2',
                    email: 'user2@example.com',
                    password: 'qwerty',
                },
                {
                    login: 'user3',
                    email: 'user3@example.com',
                    password: 'qwerty',
                },
                {
                    login: 'user4',
                    email: 'user4@example.com',
                    password: 'qwerty',
                },
            ];

            createdUserIds = [];
            for (const createUserData of createUsersData) {
                const createUserResponse = await usersTestManager.createUser(createUserData,
                    HTTP_STATUSES.CREATED_201);
                createdUserIds.push(createUserResponse.body.id);
            }

            await setDb({ blogs: initialDbBlogs, posts: initialDbPosts });
        });

        afterAll(async () => {
            await setDb();
        });

        it('should return empty array of newest likes if post has no likes', async () => {
            const getPostResponse = await postsTestManager.getPost(initialDbPosts[0].id,
                HTTP_STATUSES.OK_200);
            const post: PostViewModel = getPostResponse.body;
            expect(post.extendedLikesInfo.newestLikes).toEqual([]);
        });

        it('should add new like to newest likes array', async () => {
            const postId = initialDbPosts[0].id;

            const userIndex = 0;
            const token = await getAccessTokenForUser(userIndex);

            const data: LikeInputModel = { likeStatus: LikeStatusEnum.like };

            await postsTestManager.updatePostLikeStatus(postId, data,
                'Bearer ' + token,
                HTTP_STATUSES.NO_CONTENT_204);

            const expected: LikeDetailsViewModel[] = [
                {
                    addedAt: expect.any(String),
                    userId: createdUserIds[userIndex],
                    login: createUsersData[userIndex].login,
                },
            ];

            const getPostResponse = await postsTestManager.getPost(postId, HTTP_STATUSES.OK_200);
            const post: PostViewModel = getPostResponse.body;
            expect(post.extendedLikesInfo.newestLikes).toEqual(expected);
        });

        it(`shouldn't add like to newest likes array when dislike is added to post`, async () => {
            const postId = initialDbPosts[0].id;

            const userIndex = 1;
            const token = await getAccessTokenForUser(userIndex);

            const data: LikeInputModel = { likeStatus: LikeStatusEnum.dislike };

            await postsTestManager.updatePostLikeStatus(postId, data,
                'Bearer ' + token,
                HTTP_STATUSES.NO_CONTENT_204);

            const expected: LikeDetailsViewModel[] = [
                {
                    addedAt: expect.any(String),
                    userId: createdUserIds[0],
                    login: createUsersData[0].login,
                },
            ];

            const getPostResponse = await postsTestManager.getPost(postId, HTTP_STATUSES.OK_200);
            const post: PostViewModel = getPostResponse.body;
            expect(post.extendedLikesInfo.newestLikes).toEqual(expected);
        });

        it('should return array with all 3 likes added to post in order of creation', async () => {
            const postId = initialDbPosts[0].id;

            const data: LikeInputModel = { likeStatus: LikeStatusEnum.like };

            let userIndex = 1;
            let token = await getAccessTokenForUser(userIndex);
            await postsTestManager.updatePostLikeStatus(postId, data,
                'Bearer ' + token,
                HTTP_STATUSES.NO_CONTENT_204);

            userIndex = 2;
            token = await getAccessTokenForUser(userIndex);
            await postsTestManager.updatePostLikeStatus(postId, data,
                'Bearer ' + token,
                HTTP_STATUSES.NO_CONTENT_204);

            const expected: LikeDetailsViewModel[] = [
                {
                    addedAt: expect.any(String),
                    userId: createdUserIds[2],
                    login: createUsersData[2].login,
                },
                {
                    addedAt: expect.any(String),
                    userId: createdUserIds[1],
                    login: createUsersData[1].login,
                },
                {
                    addedAt: expect.any(String),
                    userId: createdUserIds[0],
                    login: createUsersData[0].login,
                },
            ];

            const getPostResponse = await postsTestManager.getPost(postId, HTTP_STATUSES.OK_200);
            const post: PostViewModel = getPostResponse.body;
            expect(post.extendedLikesInfo.newestLikes).toEqual(expected);
        });

        it('should replace the oldest among previous newest likes with new like', async () => {
            const postId = initialDbPosts[0].id;

            const userIndex = 3;
            const token = await getAccessTokenForUser(userIndex);

            const data: LikeInputModel = { likeStatus: LikeStatusEnum.like };

            await postsTestManager.updatePostLikeStatus(postId, data,
                'Bearer ' + token,
                HTTP_STATUSES.NO_CONTENT_204);

            const expected: LikeDetailsViewModel[] = [
                {
                    addedAt: expect.any(String),
                    userId: createdUserIds[3],
                    login: createUsersData[3].login,
                },
                {
                    addedAt: expect.any(String),
                    userId: createdUserIds[2],
                    login: createUsersData[2].login,
                },
                {
                    addedAt: expect.any(String),
                    userId: createdUserIds[1],
                    login: createUsersData[1].login,
                },
            ];

            const getPostResponse = await postsTestManager.getPost(postId, HTTP_STATUSES.OK_200);
            const post: PostViewModel = getPostResponse.body;
            expect(post.extendedLikesInfo.newestLikes).toEqual(expected);
        });

        it(`shouldn't add like to newest likes if it's a relike`, async () => {
            const postId = initialDbPosts[0].id;

            const userIndex = 0;
            const token = await getAccessTokenForUser(userIndex);

            const data: LikeInputModel = { likeStatus: LikeStatusEnum.like };

            await postsTestManager.updatePostLikeStatus(postId, data,
                'Bearer ' + token,
                HTTP_STATUSES.NO_CONTENT_204);

            const expected: LikeDetailsViewModel[] = [
                {
                    addedAt: expect.any(String),
                    userId: createdUserIds[3],
                    login: createUsersData[3].login,
                },
                {
                    addedAt: expect.any(String),
                    userId: createdUserIds[2],
                    login: createUsersData[2].login,
                },
                {
                    addedAt: expect.any(String),
                    userId: createdUserIds[1],
                    login: createUsersData[1].login,
                },
            ];

            const getPostResponse = await postsTestManager.getPost(postId, HTTP_STATUSES.OK_200);
            const post: PostViewModel = getPostResponse.body;
            expect(post.extendedLikesInfo.newestLikes).toEqual(expected);
        });

        it('should add pushed out like to newest likes if one of newest likes is deleted',
            async () => {
            const postId = initialDbPosts[0].id;

            const userIndex = 2;
            const token = await getAccessTokenForUser(userIndex);

            const data: LikeInputModel = { likeStatus: LikeStatusEnum.none };

            await postsTestManager.updatePostLikeStatus(postId, data,
                'Bearer ' + token,
                HTTP_STATUSES.NO_CONTENT_204);

            const expected: LikeDetailsViewModel[] = [
                {
                    addedAt: expect.any(String),
                    userId: createdUserIds[3],
                    login: createUsersData[3].login,
                },
                {
                    addedAt: expect.any(String),
                    userId: createdUserIds[1],
                    login: createUsersData[1].login,
                },
                {
                    addedAt: expect.any(String),
                    userId: createdUserIds[0],
                    login: createUsersData[0].login,
                },
            ];

            const getPostResponse = await postsTestManager.getPost(postId, HTTP_STATUSES.OK_200);
            const post: PostViewModel = getPostResponse.body;
            expect(post.extendedLikesInfo.newestLikes).toEqual(expected);
        });

        it(`shouldn't change newest likes array when reliking one of newest likes`, async () => {
            const postId = initialDbPosts[0].id;

            const userIndex = 1;
            const token = await getAccessTokenForUser(userIndex);

            let data: LikeInputModel = { likeStatus: LikeStatusEnum.none };
            await postsTestManager.updatePostLikeStatus(postId, data,
                'Bearer ' + token,
                HTTP_STATUSES.NO_CONTENT_204);

            data = { likeStatus: LikeStatusEnum.like };
            await postsTestManager.updatePostLikeStatus(postId, data,
                'Bearer ' + token,
                HTTP_STATUSES.NO_CONTENT_204);

            const expected: LikeDetailsViewModel[] = [
                {
                    addedAt: expect.any(String),
                    userId: createdUserIds[3],
                    login: createUsersData[3].login,
                },
                {
                    addedAt: expect.any(String),
                    userId: createdUserIds[1],
                    login: createUsersData[1].login,
                },
                {
                    addedAt: expect.any(String),
                    userId: createdUserIds[0],
                    login: createUsersData[0].login,
                },
            ];

            const getPostResponse = await postsTestManager.getPost(postId, HTTP_STATUSES.OK_200);
            const post: PostViewModel = getPostResponse.body;
            expect(post.extendedLikesInfo.newestLikes).toEqual(expected);
        });

        it('should return 2 newest likes when post has only 2 left',async () => {
            const postId = initialDbPosts[0].id;

            const userIndex = 0;
            const token = await getAccessTokenForUser(userIndex);

            const data: LikeInputModel = { likeStatus: LikeStatusEnum.none };
            await postsTestManager.updatePostLikeStatus(postId, data,
                'Bearer ' + token,
                HTTP_STATUSES.NO_CONTENT_204);

            const expected: LikeDetailsViewModel[] = [
                {
                    addedAt: expect.any(String),
                    userId: createdUserIds[3],
                    login: createUsersData[3].login,
                },
                {
                    addedAt: expect.any(String),
                    userId: createdUserIds[1],
                    login: createUsersData[1].login,
                },
            ];

            const getPostResponse = await postsTestManager.getPost(postId, HTTP_STATUSES.OK_200);
            const post: PostViewModel = getPostResponse.body;
            expect(post.extendedLikesInfo.newestLikes).toEqual(expected);
        });

        it('should return empty array of newest likes if all likes of post were deleted',
            async () => {
            const postId = initialDbPosts[0].id;

            const data: LikeInputModel = { likeStatus: LikeStatusEnum.none };

            let userIndex = 1;
            let token = await getAccessTokenForUser(userIndex);
            await postsTestManager.updatePostLikeStatus(postId, data,
                'Bearer ' + token,
                HTTP_STATUSES.NO_CONTENT_204);

            userIndex = 3;
            token = await getAccessTokenForUser(userIndex);
            await postsTestManager.updatePostLikeStatus(postId, data,
                'Bearer ' + token,
                HTTP_STATUSES.NO_CONTENT_204);

            const getPostResponse = await postsTestManager.getPost(postId, HTTP_STATUSES.OK_200);
            const post: PostViewModel = getPostResponse.body;
            expect(post.extendedLikesInfo.newestLikes).toEqual([]);
        });
    });
});