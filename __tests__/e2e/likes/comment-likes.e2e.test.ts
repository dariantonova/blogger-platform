import {MongoMemoryServer} from "mongodb-memory-server";
import {BlogDBType, LikeStatusEnum, PostDBType} from "../../../src/types/types";
import {CreateUserInputModel} from "../../../src/features/users/models/CreateUserInputModel";
import {ObjectId, WithId} from "mongodb";
import {
    CommentDBType,
    CommentViewModel,
    CreateCommentInputModel
} from "../../../src/features/comments/comments.types";
import {client, runDb, setDb} from "../../../src/db/db";
import {usersTestManager} from "../../test-managers/users-test-manager";
import {HTTP_STATUSES} from "../../../src/utils";
import mongoose from "mongoose";
import {authTestManager} from "../../test-managers/auth-test-manager";
import {LoginInputModel} from "../../../src/features/auth/types/auth.types";
import {SETTINGS} from "../../../src/settings";
import {req} from "../../test-helpers";
import {commentsTestManager} from "../../test-managers/comments-test-manager";
import {defaultAccessTokenLife} from "../../datasets/authorization-data";
import {requestsLimit} from "../../../src/middlewares/rate-limiting-middleware";
import {validCommentFieldInput} from "../../datasets/validation/comments-validation-data";
import {postsTestManager} from "../../test-managers/posts-test-manager";
import {LikeInputModel, LikesInfoViewModel} from "../../../src/features/likes/likes.types";

describe('tests for comment likes',  () => {
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

        initialDbComments = [
            {
                _id: new ObjectId(),
                content: 'Super comment number 1.',
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
                content: 'Super comment number 2.',
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
                content: 'Super comment number 3.',
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
            }
        ];

        await setDb({ blogs: initialDbBlogs, posts: initialDbPosts, comments: initialDbComments });
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
        const commentId = initialDbComments[0]._id.toString();
        const data: LikeInputModel = { likeStatus: LikeStatusEnum.like };

        await req
            .put(SETTINGS.PATH.COMMENTS + '/' + commentId + '/like-status')
            .send(data)
            .expect(HTTP_STATUSES.UNAUTHORIZED_401);

        await commentsTestManager.checkCommentLikesCount(commentId, 0);
    });

    // - invalid token
    it('should return 401 if access token is invalid', async () => {
        const commentId = initialDbComments[0]._id.toString();
        const data: LikeInputModel = { likeStatus: LikeStatusEnum.like };

        // never existed, weird
        await commentsTestManager.updateCommentLikeStatus(commentId, data,
            'Bearer somethingWeird',
            HTTP_STATUSES.UNAUTHORIZED_401);

        // existed, but user was deleted
        const userIndex = 2;
        const token = await getAccessTokenForUser(userIndex);

        await usersTestManager.deleteUser(createdUserIds[userIndex],
            HTTP_STATUSES.NO_CONTENT_204);

        await commentsTestManager.updateCommentLikeStatus(commentId, data,
            'Bearer ' + token,
            HTTP_STATUSES.UNAUTHORIZED_401);

        await commentsTestManager.checkCommentLikesCount(commentId, 0);
    });

    // - expired token
    it('should return 401 if token is expired', async () => {
        const commentId = initialDbComments[0]._id.toString();
        const data: LikeInputModel = { likeStatus: LikeStatusEnum.like };

        SETTINGS.ACCESS_JWT_LIFE = '0';
        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        await commentsTestManager.updateCommentLikeStatus(commentId, data,
            'Bearer ' + token,
            HTTP_STATUSES.UNAUTHORIZED_401);

        await commentsTestManager.checkCommentLikesCount(commentId, 0);

        SETTINGS.ACCESS_JWT_LIFE = defaultAccessTokenLife;
    });

    // - invalid auth format
    it('should return 401 if auth header format is invalid', async () => {
        const commentId = initialDbComments[0]._id.toString();
        const data: LikeInputModel = { likeStatus: LikeStatusEnum.like };

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        await commentsTestManager.updateCommentLikeStatus(commentId, data,
            token,
            HTTP_STATUSES.UNAUTHORIZED_401);

        await commentsTestManager.updateCommentLikeStatus(commentId, data,
            token + ' Bearer',
            HTTP_STATUSES.UNAUTHORIZED_401);

        await commentsTestManager.checkCommentLikesCount(commentId, 0);
    });

    it('should return 400 if like status is invalid', async () => {
        const commentId = initialDbComments[0]._id.toString();

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const data = { likeStatus: '-100' };

        await commentsTestManager.updateCommentLikeStatus(commentId, data,
            'Bearer ' + token,
            HTTP_STATUSES.BAD_REQUEST_400);

        const getCommentResponse = await commentsTestManager.getComment(commentId, HTTP_STATUSES.OK_200);
        expect(getCommentResponse.body.likesInfo.likesCount).toBe(0);
        expect(getCommentResponse.body.likesInfo.dislikesCount).toBe(0);
    });

    it(`should return 404 if comment doesn't exist`, async () => {
        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const data: LikeInputModel = { likeStatus: LikeStatusEnum.like };

        // non-existing
        let commentId = '-1';
        await commentsTestManager.updateCommentLikeStatus(commentId, data,
            'Bearer ' + token,
            HTTP_STATUSES.NOT_FOUND_404);

        // deleted
        commentId = initialDbComments[2]._id.toString();
        await commentsTestManager.updateCommentLikeStatus(commentId, data,
            'Bearer ' + token,
            HTTP_STATUSES.NOT_FOUND_404);
    });

    it('should like comment', async () => {
        const commentId = initialDbComments[0]._id.toString();

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const data: LikeInputModel = { likeStatus: LikeStatusEnum.like };

        await commentsTestManager.updateCommentLikeStatus(commentId, data,
            'Bearer ' + token,
            HTTP_STATUSES.NO_CONTENT_204);

        const expectedLikesInfo: LikesInfoViewModel = {
            likesCount: 1,
            dislikesCount: 0,
            myStatus: LikeStatusEnum.like,
        };
        const getCommentResponse = await commentsTestManager.getComment(commentId,
            HTTP_STATUSES.OK_200, 'Bearer ' + token);
        expect(getCommentResponse.body.likesInfo).toEqual(expectedLikesInfo);
    });

    it(`shouldn't like comment multiple times by one user`, async () => {
        const commentId = initialDbComments[0]._id.toString();

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const data: LikeInputModel = { likeStatus: LikeStatusEnum.like };

        await commentsTestManager.updateCommentLikeStatus(commentId, data,
            'Bearer ' + token,
            HTTP_STATUSES.NO_CONTENT_204);

        const expectedLikesInfo: LikesInfoViewModel = {
            likesCount: 1,
            dislikesCount: 0,
            myStatus: LikeStatusEnum.like,
        };
        const getCommentResponse = await commentsTestManager.getComment(commentId,
            HTTP_STATUSES.OK_200, 'Bearer ' + token);
        expect(getCommentResponse.body.likesInfo).toEqual(expectedLikesInfo);
    });

    it(`should replace like with dislike`, async () => {
        const commentId = initialDbComments[0]._id.toString();

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const data: LikeInputModel = { likeStatus: LikeStatusEnum.dislike };

        await commentsTestManager.updateCommentLikeStatus(commentId, data,
            'Bearer ' + token,
            HTTP_STATUSES.NO_CONTENT_204);

        const expectedLikesInfo: LikesInfoViewModel = {
            likesCount: 0,
            dislikesCount: 1,
            myStatus: LikeStatusEnum.dislike,
        };
        const getCommentResponse = await commentsTestManager.getComment(commentId,
            HTTP_STATUSES.OK_200, 'Bearer ' + token);
        expect(getCommentResponse.body.likesInfo).toEqual(expectedLikesInfo);
    });

    it(`shouldn't dislike comment multiple times by one user`, async () => {
        const commentId = initialDbComments[0]._id.toString();

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const data: LikeInputModel = { likeStatus: LikeStatusEnum.dislike };

        await commentsTestManager.updateCommentLikeStatus(commentId, data,
            'Bearer ' + token,
            HTTP_STATUSES.NO_CONTENT_204);

        const expectedLikesInfo: LikesInfoViewModel = {
            likesCount: 0,
            dislikesCount: 1,
            myStatus: LikeStatusEnum.dislike,
        };
        const getCommentResponse = await commentsTestManager.getComment(commentId,
            HTTP_STATUSES.OK_200, 'Bearer ' + token);
        expect(getCommentResponse.body.likesInfo).toEqual(expectedLikesInfo);
    });

    it(`should undislike comment`, async () => {
        const commentId = initialDbComments[0]._id.toString();

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const data: LikeInputModel = { likeStatus: LikeStatusEnum.none };

        await commentsTestManager.updateCommentLikeStatus(commentId, data,
            'Bearer ' + token,
            HTTP_STATUSES.NO_CONTENT_204);

        const expectedLikesInfo: LikesInfoViewModel = {
            likesCount: 0,
            dislikesCount: 0,
            myStatus: LikeStatusEnum.none,
        };
        const getCommentResponse = await commentsTestManager.getComment(commentId,
            HTTP_STATUSES.OK_200, 'Bearer ' + token);
        expect(getCommentResponse.body.likesInfo).toEqual(expectedLikesInfo);
    });

    it(`should do nothing when removing non-existing like or dislike`, async () => {
        const commentId = initialDbComments[0]._id.toString();

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const data: LikeInputModel = { likeStatus: LikeStatusEnum.none };

        await commentsTestManager.updateCommentLikeStatus(commentId, data,
            'Bearer ' + token,
            HTTP_STATUSES.NO_CONTENT_204);

        const expectedLikesInfo: LikesInfoViewModel = {
            likesCount: 0,
            dislikesCount: 0,
            myStatus: LikeStatusEnum.none,
        };
        const getCommentResponse = await commentsTestManager.getComment(commentId,
            HTTP_STATUSES.OK_200, 'Bearer ' + token);
        expect(getCommentResponse.body.likesInfo).toEqual(expectedLikesInfo);
    });

    it(`should dislike comment`, async () => {
        const commentId = initialDbComments[0]._id.toString();

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const data: LikeInputModel = { likeStatus: LikeStatusEnum.dislike };

        await commentsTestManager.updateCommentLikeStatus(commentId, data,
            'Bearer ' + token,
            HTTP_STATUSES.NO_CONTENT_204);

        const expectedLikesInfo: LikesInfoViewModel = {
            likesCount: 0,
            dislikesCount: 1,
            myStatus: LikeStatusEnum.dislike,
        };
        const getCommentResponse = await commentsTestManager.getComment(commentId,
            HTTP_STATUSES.OK_200, 'Bearer ' + token);
        expect(getCommentResponse.body.likesInfo).toEqual(expectedLikesInfo);
    });

    it(`should replace dislike with like`, async () => {
        const commentId = initialDbComments[0]._id.toString();

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const data: LikeInputModel = { likeStatus: LikeStatusEnum.like };

        await commentsTestManager.updateCommentLikeStatus(commentId, data,
            'Bearer ' + token,
            HTTP_STATUSES.NO_CONTENT_204);

        const expectedLikesInfo: LikesInfoViewModel = {
            likesCount: 1,
            dislikesCount: 0,
            myStatus: LikeStatusEnum.like,
        };
        const getCommentResponse = await commentsTestManager.getComment(commentId,
            HTTP_STATUSES.OK_200, 'Bearer ' + token);
        expect(getCommentResponse.body.likesInfo).toEqual(expectedLikesInfo);
    });

    it(`should unlike comment`, async () => {
        const commentId = initialDbComments[0]._id.toString();

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const data: LikeInputModel = { likeStatus: LikeStatusEnum.none };

        await commentsTestManager.updateCommentLikeStatus(commentId, data,
            'Bearer ' + token,
            HTTP_STATUSES.NO_CONTENT_204);

        const expectedLikesInfo: LikesInfoViewModel = {
            likesCount: 0,
            dislikesCount: 0,
            myStatus: LikeStatusEnum.none,
        };
        const getCommentResponse = await commentsTestManager.getComment(commentId,
            HTTP_STATUSES.OK_200, 'Bearer ' + token);
        expect(getCommentResponse.body.likesInfo).toEqual(expectedLikesInfo);
    });

    it(`should like comment multiple times by different users`, async () => {
        const commentId = initialDbComments[0]._id.toString();

        const data: LikeInputModel = { likeStatus: LikeStatusEnum.like };

        let userIndex = 0;
        const token1 = await getAccessTokenForUser(userIndex);
        userIndex = 1;
        const token2 = await getAccessTokenForUser(userIndex);

        await commentsTestManager.updateCommentLikeStatus(commentId, data,
            'Bearer ' + token1,
            HTTP_STATUSES.NO_CONTENT_204);
        await commentsTestManager.updateCommentLikeStatus(commentId, data,
            'Bearer ' + token2,
            HTTP_STATUSES.NO_CONTENT_204);

        await commentsTestManager.checkCommentLikesCount(commentId, 2);
    });

    it(`should dislike comment multiple times by different users`, async () => {
        const commentId = initialDbComments[0]._id.toString();

        const data: LikeInputModel = { likeStatus: LikeStatusEnum.dislike };

        let userIndex = 0;
        const token1 = await getAccessTokenForUser(userIndex);
        userIndex = 1;
        const token2 = await getAccessTokenForUser(userIndex);

        await commentsTestManager.updateCommentLikeStatus(commentId, data,
            'Bearer ' + token1,
            HTTP_STATUSES.NO_CONTENT_204);
        await commentsTestManager.updateCommentLikeStatus(commentId, data,
            'Bearer ' + token2,
            HTTP_STATUSES.NO_CONTENT_204);

        await commentsTestManager.checkCommentDislikesCount(commentId, 2);
    });

    it(`should return like status none when getting comment by unauthorized user`, async () => {
        const commentId = initialDbComments[0]._id.toString();
        const getCommentResponse = await commentsTestManager.getComment(commentId,
            HTTP_STATUSES.OK_200, '');
        expect(getCommentResponse.body.likesInfo.myStatus).toBe(LikeStatusEnum.none);
    });

    it(`should create comment with 0 likes and 0 dislikes`, async () => {
        const postId = initialDbPosts[0].id;
        const data: CreateCommentInputModel = {
            content: validCommentFieldInput.content,
        };

        const userIndex = 0;
        const token = await getAccessTokenForUser(userIndex);

        const createCommentResponse = await postsTestManager.createPostComment(postId, data,
            'Bearer ' + token,
            HTTP_STATUSES.CREATED_201);
        const createdComment: CommentViewModel = createCommentResponse.body;
        const expectedLikesInfo: LikesInfoViewModel = {
            likesCount: 0,
            dislikesCount: 0,
            myStatus: LikeStatusEnum.none,
        };
        expect(createdComment.likesInfo).toEqual(expectedLikesInfo);
    });

    it(`should remove user's comment likes and dislikes when deleting user`, async () => {
        initialDbComments = [
            {
                _id: new ObjectId(),
                content: 'Super comment number 1.',
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
                content: 'Super comment number 2.',
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
            }
        ];

        await setDb({ comments: initialDbComments });

        const userIndex = 1;
        const token = await getAccessTokenForUser(userIndex);

        const commentId1 = initialDbComments[0]._id.toString();
        const data1: LikeInputModel = { likeStatus: LikeStatusEnum.like };

        const commentId2 = initialDbComments[1]._id.toString();
        const data2: LikeInputModel = { likeStatus: LikeStatusEnum.dislike };

        await commentsTestManager.updateCommentLikeStatus(commentId1, data1,
            'Bearer ' + token,
            HTTP_STATUSES.NO_CONTENT_204);
        await commentsTestManager.updateCommentLikeStatus(commentId2, data2,
            'Bearer ' + token,
            HTTP_STATUSES.NO_CONTENT_204);

        await usersTestManager.deleteUser(createdUserIds[userIndex], HTTP_STATUSES.NO_CONTENT_204);

        const getComment1Response = await commentsTestManager.getComment(commentId1, HTTP_STATUSES.OK_200);
        expect(getComment1Response.body.likesInfo.likesCount).toBe(initialDbComments[0].likesInfo.likesCount);

        const getComment2Response = await commentsTestManager.getComment(commentId2, HTTP_STATUSES.OK_200);
        expect(getComment2Response.body.likesInfo.dislikesCount).toBe(initialDbComments[1].likesInfo.dislikesCount);
    });
});