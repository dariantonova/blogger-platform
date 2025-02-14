import {MongoMemoryServer} from "mongodb-memory-server";
import {BlogDBType, PostDBType} from "../../../src/types/types";
import {CreateUserInputModel} from "../../../src/features/users/models/CreateUserInputModel";
import {client, runDb, setDb} from "../../../src/db/db";
import {req} from "../../test-helpers";
import {SETTINGS} from "../../../src/settings";
import {usersTestManager} from "../../test-managers/users-test-manager";
import {HTTP_STATUSES} from "../../../src/utils";
import {CommentDBType} from "../../../src/features/comments/comments.types";
import {ObjectId, WithId} from "mongodb";
import mongoose from "mongoose";
import {container} from "../../../src/composition-root";
import {CommentsQueryRepository} from "../../../src/features/comments/comments.query.repository";

const commentsQueryRepository = container.get<CommentsQueryRepository>(CommentsQueryRepository);

describe('test for get comment endpoint', () => {
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
        ];
        await setDb({ comments: initialDbComments });
    });

    afterEach(async () => {
        await req
            .delete(SETTINGS.PATH.TESTING + '/all-data');
    });

    it('should return 404 for non-existing comment', async () => {
        await req
            .get(SETTINGS.PATH.COMMENTS + '/-100')
            .expect(HTTP_STATUSES.NOT_FOUND_404);

        // deleted
        const commentId = initialDbComments[1]._id.toString();
        await req
            .get(SETTINGS.PATH.COMMENTS + '/' + commentId)
            .expect(HTTP_STATUSES.NOT_FOUND_404);
    });

    it('should return the first comment', async () => {
        await setDb({ comments: initialDbComments });

        const comment = initialDbComments[0];
        const commentId = comment._id.toString();

        const expected = await commentsQueryRepository.mapToOutput(comment);
        const response = await req
            .get(SETTINGS.PATH.COMMENTS + '/' + commentId)
            .expect(HTTP_STATUSES.OK_200);
        expect(response.body).toEqual(expected);
    });
});