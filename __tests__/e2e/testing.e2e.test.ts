import {blogsCollection, client, postsCollection, runDb, setDb} from "../../src/db/db";
import {MongoMemoryServer} from "mongodb-memory-server";
import * as datasets from '../datasets';
import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";

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
        await setDb({ blogs: datasets.blogs, posts: datasets.posts });

        await req
            .delete(SETTINGS.PATH.TESTING + '/all-data');

        expect(await blogsCollection.find({}).toArray()).toEqual([]);
        expect(await postsCollection.find({}).toArray()).toEqual([]);
    });

});