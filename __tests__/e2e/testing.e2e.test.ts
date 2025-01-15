import {blogsCollection, client, postsCollection, runDb, setDb} from "../../src/db/db";
import {MongoMemoryServer} from "mongodb-memory-server";
import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {BlogDBType, PostDBType} from "../../src/types/types";

describe('tests for /testing', () => {
    let server: MongoMemoryServer;

    beforeAll(async () => {
        server = await MongoMemoryServer.create();
        const uri = server.getUri();

        const res = await runDb(uri);
        expect(res).toBe(true);
    });

    afterAll(async () => {
        await client.close();
        await server.stop();
    });

    it('should clear the database', async () => {
        const blogs: BlogDBType[] = [
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
        const posts: PostDBType[] = [
            {
                id: '1',
                title: 'post 1',
                shortDescription: 'superpost 1',
                content: 'content of superpost 1',
                blogId: '2',
                blogName: 'blog 2',
                isDeleted: false,
                createdAt: '2024-12-15T05:32:26.882Z',
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
            {
                id: '3',
                title: 'post 3',
                shortDescription: 'superpost 3',
                content: 'content of superpost 3',
                blogId: '1',
                blogName: 'blog 1',
                isDeleted: true,
                createdAt: '2024-12-16T05:32:26.882Z',
            },
            {
                id: '4',
                title: 'post 4',
                shortDescription: 'superpost 4',
                content: 'content of superpost 4',
                blogId: '1',
                blogName: 'blog 1',
                isDeleted: false,
                createdAt: '2024-12-16T05:32:26.882Z',
            },
        ];

        await setDb({ blogs, posts });

        await req
            .delete(SETTINGS.PATH.TESTING + '/all-data');

        expect(await blogsCollection.find({}).toArray()).toEqual([]);
        expect(await postsCollection.find({}).toArray()).toEqual([]);
    });

});