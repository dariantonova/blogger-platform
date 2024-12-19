import {BlogDBType, DBType, PostDBType} from "../types";
import {Collection, MongoClient} from "mongodb";
import {SETTINGS} from "../settings";

export let client: MongoClient;
export let blogsCollection: Collection<BlogDBType>;
export let postsCollection: Collection<PostDBType>;

export const runDb = async (url: string): Promise<boolean> => {
    try {
        client = new MongoClient(url);
        const db = client.db(SETTINGS.DB_NAME);

        blogsCollection = db.collection<BlogDBType>('blogs');
        postsCollection = db.collection<PostDBType>('posts');

        await client.connect();
        await db.command({ ping: 1 });
        console.log('Successfully connected to mongo server');
        return true;
    }
    catch {
        console.log('Cannot connect to mongo server');
        await client.close();
        return false;
    }
};

export const setDb = async (dataset?: Partial<DBType>) => {
    if (!dataset) {
        await blogsCollection.drop();
        await postsCollection.drop();
        return;
    }

    if (dataset.blogs) {
        await blogsCollection.drop();
        await blogsCollection.insertMany(structuredClone(dataset.blogs));
    }

    if (dataset.posts) {
        await postsCollection.drop();
        await postsCollection.insertMany(structuredClone(dataset.posts));
    }
};

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
];

const posts: PostDBType[] = [
    {
        id: '1',
        title: 'post 1',
        shortDescription: 'superpost 1',
        content: 'content of superpost 1',
        blogId: '2',
        isDeleted: false,
        createdAt: '2024-12-15T05:32:26.882Z',
    },
    {
        id: '2',
        title: 'post 2',
        shortDescription: 'superpost 2',
        content: 'content of superpost 2',
        blogId: '1',
        isDeleted: false,
        createdAt: '2024-12-16T05:32:26.882Z',
    },
];

export const initialDb: DBType = {
    blogs,
    posts,
};
