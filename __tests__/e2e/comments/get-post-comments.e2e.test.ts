import {MongoMemoryServer} from "mongodb-memory-server";
import {BlogDBType, PostDBType} from "../../../src/types/types";
import {CreateUserInputModel} from "../../../src/features/users/models/CreateUserInputModel";
import {ObjectId, WithId} from "mongodb";
import {CommentDBType} from "../../../src/features/comments/comments.types";
import {client, runDb, setDb} from "../../../src/db/db";
import {usersTestManager} from "../../test-managers/users-test-manager";
import {HTTP_STATUSES} from "../../../src/utils";
import {DEFAULT_QUERY_VALUES} from "../../../src/helpers/query-params-values";
import {postsTestManager} from "../../test-managers/posts-test-manager";
import {invalidPageNumbers, invalidPageSizes} from "../../datasets/validation/query-validation-data";
import mongoose from "mongoose";
import {commentsQueryRepository} from "../../../src/composition-root";

describe('tests for get post comments endpoint', () => {
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

        await setDb({ blogs: initialDbBlogs, posts: initialDbPosts });

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
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await client.close();
        await server.stop();
    });

    // empty array
    it('should return empty array', async () => {
        const postId = initialDbPosts[0].id;

        const expected = await commentsQueryRepository.createCommentsPaginator(
            [],
            DEFAULT_QUERY_VALUES.USERS.pageNumber,
            DEFAULT_QUERY_VALUES.USERS.pageSize,
            0,
            0,
        );

        const response = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200);
        expect(response.body).toEqual(expected);
    });

    // full array
    it('should return array with all comments of the first post', async () => {
        initialDbComments = [
            {
                _id: new ObjectId(),
                content: 'Comment number 1. Wow!',
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
                content: 'Comment number 2. Wow!',
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
                content: 'Comment number 3. Wow!',
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
                content: 'Comment number 4. Wow!',
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
                content: 'Comment number 5. Wow!',
                postId: initialDbPosts[1].id,
                commentatorInfo: {
                    userId: createdUserIds[0],
                    userLogin: createUsersData[0].login,
                },
                createdAt: '2024-12-16T05:32:26.882Z',
                isDeleted: false,
            },
            {
                _id: new ObjectId(),
                content: 'Comment number 6. Wow!',
                postId: initialDbPosts[1].id,
                commentatorInfo: {
                    userId: createdUserIds[0],
                    userLogin: createUsersData[0].login,
                },
                createdAt: '2024-12-16T05:32:26.882Z',
                isDeleted: false,
            },
        ];
        await setDb({ comments: initialDbComments });

        const postId = initialDbPosts[0].id;
        const expectedComments = initialDbComments
            .filter(c => !c.isDeleted && c.postId === postId);
        const expected = await commentsQueryRepository.createCommentsPaginator(
            expectedComments,
            DEFAULT_QUERY_VALUES.COMMENTS.pageNumber,
            DEFAULT_QUERY_VALUES.COMMENTS.pageSize,
            1,
            expectedComments.length,
        );

        const response = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200);
        expect(response.body).toEqual(expected);
    });

    it('should return comments of the second post', async () => {
        const postId = initialDbPosts[1].id;
        const expectedComments = initialDbComments
            .filter(c => !c.isDeleted && c.postId === postId);
        const expected = await commentsQueryRepository.createCommentsPaginator(
            expectedComments,
            DEFAULT_QUERY_VALUES.COMMENTS.pageNumber,
            DEFAULT_QUERY_VALUES.COMMENTS.pageSize,
            1,
            expectedComments.length,
        );

        const response = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200);
        expect(response.body).toEqual(expected);
    });

    // sort
    // createdAt desc
    it('should return comments sorted by creation date in desc order', async () => {
        const postId = initialDbPosts[0].id;
        initialDbComments = [
            {
                _id: new ObjectId(),
                content: 'Comment number 1. Wow!',
                postId,
                commentatorInfo: {
                    userId: createdUserIds[0],
                    userLogin: createUsersData[0].login,
                },
                createdAt: '2024-12-15T05:32:26.882Z',
                isDeleted: true,
            },
            {
                _id: new ObjectId(),
                content: 'Comment number 3. Wow!',
                postId,
                commentatorInfo: {
                    userId: createdUserIds[1],
                    userLogin: createUsersData[1].login,
                },
                createdAt: '2024-12-17T05:32:26.882Z',
                isDeleted: false,
            },
            {
                _id: new ObjectId(),
                content: 'Comment number 4. Wow!',
                postId,
                commentatorInfo: {
                    userId: createdUserIds[2],
                    userLogin: createUsersData[2].login,
                },
                createdAt: '2024-12-18T05:32:26.882Z',
                isDeleted: false,
            },
            {
                _id: new ObjectId(),
                content: 'Comment number 2. Wow!',
                postId,
                commentatorInfo: {
                    userId: createdUserIds[0],
                    userLogin: createUsersData[0].login,
                },
                createdAt: '2024-12-16T05:32:26.882Z',
                isDeleted: false,
            },
        ];

        await setDb({ comments: initialDbComments });

        const expectedComments = [
            initialDbComments[2], initialDbComments[1], initialDbComments[3]
        ];
        const expected = await commentsQueryRepository.createCommentsPaginator(
            expectedComments,
            DEFAULT_QUERY_VALUES.COMMENTS.pageNumber,
            DEFAULT_QUERY_VALUES.COMMENTS.pageSize,
            1,
            expectedComments.length,
        );

        const response1 = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
            'sortBy=createdAt&sortDirection=desc');
        expect(response1.body).toEqual(expected);

        const response2 = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
            'sortBy=createdAt');
        expect(response2.body).toEqual(expected);

        const response3 = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
            'sortDirection=desc');
        expect(response3.body).toEqual(expected);

        const response4 = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200);
        expect(response4.body).toEqual(expected);
    });

    // createdAt asc
    it('should return comments sorted by creation date in asc order', async () => {
        const postId = initialDbPosts[0].id;

        const expectedComments = [
            initialDbComments[3], initialDbComments[1], initialDbComments[2]
        ];
        const expected = await commentsQueryRepository.createCommentsPaginator(
            expectedComments,
            DEFAULT_QUERY_VALUES.COMMENTS.pageNumber,
            DEFAULT_QUERY_VALUES.COMMENTS.pageSize,
            1,
            expectedComments.length,
        );

        const response1 = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
            'sortBy=createdAt&sortDirection=asc');
        expect(response1.body).toEqual(expected);

        const response2 = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
            'sortDirection=asc');
        expect(response2.body).toEqual(expected);
    });

    // id desc
    it('should return comments sorted by id in desc order', async () => {
        const postId = initialDbPosts[0].id;

        const expectedComments = [
            initialDbComments[3], initialDbComments[2], initialDbComments[1]
        ];
        const expected = await commentsQueryRepository.createCommentsPaginator(
            expectedComments,
            DEFAULT_QUERY_VALUES.COMMENTS.pageNumber,
            DEFAULT_QUERY_VALUES.COMMENTS.pageSize,
            1,
            expectedComments.length,
        );

        const response1 = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
            'sortBy=id&sortDirection=desc');
        expect(response1.body).toEqual(expected);

        const response2 = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
            'sortBy=id');
        expect(response2.body).toEqual(expected);
    });

    // id asc
    it('should return comments sorted by id in asc order', async () => {
        const postId = initialDbPosts[0].id;

        const expectedComments = [
            initialDbComments[1], initialDbComments[2], initialDbComments[3]
        ];
        const expected = await commentsQueryRepository.createCommentsPaginator(
            expectedComments,
            DEFAULT_QUERY_VALUES.COMMENTS.pageNumber,
            DEFAULT_QUERY_VALUES.COMMENTS.pageSize,
            1,
            expectedComments.length,
        );

        const response = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
            'sortBy=id&sortDirection=asc');
        expect(response.body).toEqual(expected);
    });

    // userId desc
    it('should return comments sorted by user id in desc order', async () => {
        const postId = initialDbPosts[0].id;

        const expectedComments = [
            initialDbComments[2], initialDbComments[1], initialDbComments[3]
        ];
        const expected = await commentsQueryRepository.createCommentsPaginator(
            expectedComments,
            DEFAULT_QUERY_VALUES.COMMENTS.pageNumber,
            DEFAULT_QUERY_VALUES.COMMENTS.pageSize,
            1,
            expectedComments.length,
        );

        const response1 = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
            'sortBy=userId&sortDirection=desc');
        expect(response1.body).toEqual(expected);

        const response2 = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
            'sortBy=userId');
        expect(response2.body).toEqual(expected);
    });

    // userId asc
    it('should return comments sorted by user id in asc order', async () => {
        const postId = initialDbPosts[0].id;

        const expectedComments = [
            initialDbComments[3], initialDbComments[1], initialDbComments[2]
        ];
        const expected = await commentsQueryRepository.createCommentsPaginator(
            expectedComments,
            DEFAULT_QUERY_VALUES.COMMENTS.pageNumber,
            DEFAULT_QUERY_VALUES.COMMENTS.pageSize,
            1,
            expectedComments.length,
        );

        const response = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
            'sortBy=userId&sortDirection=asc');
        expect(response.body).toEqual(expected);
    });

    // userLogin desc
    it('should return comments sorted by user login in desc order', async () => {
        const postId = initialDbPosts[0].id;

        const expectedComments = [
            initialDbComments[2], initialDbComments[1], initialDbComments[3]
        ];
        const expected = await commentsQueryRepository.createCommentsPaginator(
            expectedComments,
            DEFAULT_QUERY_VALUES.COMMENTS.pageNumber,
            DEFAULT_QUERY_VALUES.COMMENTS.pageSize,
            1,
            expectedComments.length,
        );

        const response1 = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
            'sortBy=userLogin&sortDirection=desc');
        expect(response1.body).toEqual(expected);

        const response2 = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
            'sortBy=userLogin');
        expect(response2.body).toEqual(expected);
    });

    // userLogin asc
    it('should return comments sorted by user login in asc order', async () => {
        const postId = initialDbPosts[0].id;

        const expectedComments = [
            initialDbComments[3], initialDbComments[1], initialDbComments[2]
        ];
        const expected = await commentsQueryRepository.createCommentsPaginator(
            expectedComments,
            DEFAULT_QUERY_VALUES.COMMENTS.pageNumber,
            DEFAULT_QUERY_VALUES.COMMENTS.pageSize,
            1,
            expectedComments.length,
        );

        const response = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
            'sortBy=userLogin&sortDirection=asc');
        expect(response.body).toEqual(expected);
    });

    // content desc
    it('should return comments sorted by content in desc order', async () => {
        const postId = initialDbPosts[0].id;

        const expectedComments = [
            initialDbComments[2], initialDbComments[1], initialDbComments[3]
        ];
        const expected = await commentsQueryRepository.createCommentsPaginator(
            expectedComments,
            DEFAULT_QUERY_VALUES.COMMENTS.pageNumber,
            DEFAULT_QUERY_VALUES.COMMENTS.pageSize,
            1,
            expectedComments.length,
        );

        const response1 = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
            'sortBy=content&sortDirection=desc');
        expect(response1.body).toEqual(expected);

        const response2 = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
            'sortBy=content');
        expect(response2.body).toEqual(expected);
    });

    // content asc
    it('should return comments sorted by content in asc order', async () => {
        const postId = initialDbPosts[0].id;

        const expectedComments = [
            initialDbComments[3], initialDbComments[1], initialDbComments[2]
        ];
        const expected = await commentsQueryRepository.createCommentsPaginator(
            expectedComments,
            DEFAULT_QUERY_VALUES.COMMENTS.pageNumber,
            DEFAULT_QUERY_VALUES.COMMENTS.pageSize,
            1,
            expectedComments.length,
        );

        const response = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
            'sortBy=content&sortDirection=asc');
        expect(response.body).toEqual(expected);
    });

    // bad sort key
    it(`should return comments in the order of creation if specified sort field doesn't exist`, async () => {
        const postId = initialDbPosts[0].id;

        const expectedComments = [
            initialDbComments[1], initialDbComments[2], initialDbComments[3]
        ];
        const expected = await commentsQueryRepository.createCommentsPaginator(
            expectedComments,
            DEFAULT_QUERY_VALUES.COMMENTS.pageNumber,
            DEFAULT_QUERY_VALUES.COMMENTS.pageSize,
            1,
            expectedComments.length,
        );

        const response = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
            'sortBy=bad');
        expect(response.body).toEqual(expected);
    });

    // pagination
    // invalid pageNumber
    it('should return empty array if page number is invalid', async () => {
        initialDbComments = [
            {
                _id: new ObjectId(),
                content: 'Comment number 1. Wow!',
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
                content: 'Comment number 2. Wow!',
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
                content: 'Comment number 3. Wow!',
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
                content: 'Comment number 4. Wow!',
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
                content: 'Comment number 5. Wow!',
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
                content: 'Comment number 6. Wow!',
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
                content: 'Comment number 7. Wow!',
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
                content: 'Comment number 8. Wow!',
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
                content: 'Comment number 9. Wow!',
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
                content: 'Comment number 10. Wow!',
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
                content: 'Comment number 11. Wow!',
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
                content: 'Comment number 12. Wow!',
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
                content: 'Comment number 13. Wow!',
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
                content: 'Comment number 14. Wow!',
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
                content: 'Comment number 15. Wow!',
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
                content: 'Comment number 16. Wow!',
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
                content: 'Comment number 17. Wow!',
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
                content: 'Comment number 18. Wow!',
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
                content: 'Comment number 19. Wow!',
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
                content: 'Comment number 20. Wow!',
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
                content: 'Comment number 21. Wow!',
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
                content: 'Comment number 22. Wow!',
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
                content: 'Comment number 23. Wow!',
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
                content: 'Comment number 24. Wow!',
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

        const postId = initialDbPosts[0].id;
        const expected = await commentsQueryRepository.createCommentsPaginator(
            [], 0, 0, 0, 0,
        );
        for (const invalidPageNumber of invalidPageNumbers) {
            const response = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
                'pageNumber=' + invalidPageNumber);
            expect(response.body).toEqual(expected);
        }
    });

    // invalid pageSize
    it('should return empty array if page size is invalid', async () => {
        const postId = initialDbPosts[0].id;
        const expected = await commentsQueryRepository.createCommentsPaginator(
            [], 0, 0, 0, 0,
        );
        for (const invalidPageSize of invalidPageSizes) {
            const response = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
                'pageNumber=' + invalidPageSize);
            expect(response.body).toEqual(expected);
        }
    });

    // invalid pageNumber and pageSize
    it('should return empty array if page number and page size are invalid',
        async () => {
        const invalidPageNumber = invalidPageNumbers[0];
        const invalidPageSize = invalidPageSizes[0];

        const postId = initialDbPosts[0].id;
        const expected = await commentsQueryRepository.createCommentsPaginator(
            [], 0, 0, 0, 0,
        );
        const response = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
            'pageNumber=' + invalidPageNumber
            + '&pageSize=' + invalidPageSize);
        expect(response.body).toEqual(expected);
    });

    // pageNumber and pageSize defaults
    it('default page number and page size should be correct', async () => {
        const defaultPageSize = 10;
        const defaultPageNumber = 1;

        const postId = initialDbPosts[0].id;
        const expectedComments = initialDbComments.slice(0, defaultPageSize);
        const expected = await commentsQueryRepository.createCommentsPaginator(
            expectedComments,
            defaultPageNumber,
            defaultPageSize,
            Math.ceil(initialDbComments.length / defaultPageSize),
            initialDbComments.length,
        );

        const response = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200);
        expect(response.body).toEqual(expected);
    });

    // non-default pageNumber
    it('should return correct part of comments array if page number is non-default',
        async () => {
        const pageNumber = 2;
        const pageSize = DEFAULT_QUERY_VALUES.COMMENTS.pageSize;

        const postId = initialDbPosts[0].id;
        const expectedComments = initialDbComments.slice(pageSize, 2 * pageSize);
        const expected = await commentsQueryRepository.createCommentsPaginator(
            expectedComments,
            pageNumber,
            pageSize,
            Math.ceil(initialDbComments.length / pageSize),
            initialDbComments.length,
        );

        const response = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
            'pageNumber=' + pageNumber);
        expect(response.body).toEqual(expected);
    });

    // non-default pageSize
    it('should return correct part of comments array if page size is non-default',
        async () => {
        const pageSize = 15;

        const postId = initialDbPosts[0].id;
        const expectedComments = initialDbComments.slice(0, pageSize);
        const expected = await commentsQueryRepository.createCommentsPaginator(
            expectedComments,
            DEFAULT_QUERY_VALUES.COMMENTS.pageNumber,
            pageSize,
            Math.ceil(initialDbComments.length / pageSize),
            initialDbComments.length,
        );

        const response = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
            'pageSize=' + pageSize);
        expect(response.body).toEqual(expected);
    });

    // non-default pageNumber and pageSize
    it('should return correct part of comments array if page number and page size are non-default',
        async () => {
        const pageNumber = 3;
        const pageSize = 15;

        const postId = initialDbPosts[0].id;
        const expectedComments = initialDbComments.slice(
            (pageNumber - 1) * pageSize, pageNumber * pageSize
        );
        const expected = await commentsQueryRepository.createCommentsPaginator(
            expectedComments,
            pageNumber,
            pageSize,
            Math.ceil(initialDbComments.length / pageSize),
            initialDbComments.length,
        );

        const response = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
            'pageNumber=' + pageNumber
            + '&pageSize=' + pageSize);
        expect(response.body).toEqual(expected);
    });

    // pageNumber > total number of pages
    it('should return empty array if page number exceeds total number of pages',
        async () => {
        const pageSize = DEFAULT_QUERY_VALUES.COMMENTS.pageSize;
        const totalCount = initialDbComments.length;
        const pagesCount = Math.ceil(totalCount / pageSize);
        const pageNumber = pageSize + 5;

        const postId = initialDbPosts[0].id;
        const expectedComments: WithId<CommentDBType>[] = [];
        const expected = await commentsQueryRepository.createCommentsPaginator(
            expectedComments,
            pageNumber,
            pageSize,
            pagesCount,
            totalCount
        );

        const response = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
            'pageNumber=' + pageNumber);
        expect(response.body).toEqual(expected);
    });

    // pageSize > total number of items
    it('should return all comments of the first post if page size is greater than total number of users',
        async () => {
        const expectedComments = initialDbComments;
        const totalCount = expectedComments.length;
        const pageSize = totalCount + 5;

        const postId = initialDbPosts[0].id;
        const expected = await commentsQueryRepository.createCommentsPaginator(
            expectedComments,
            DEFAULT_QUERY_VALUES.COMMENTS.pageNumber,
            pageSize,
            Math.ceil(totalCount / pageSize),
            totalCount
        );

        const response = await postsTestManager.getPostComments(postId, HTTP_STATUSES.OK_200,
            'pageSize=' + pageSize);
        expect(response.body).toEqual(expected);
    });
});