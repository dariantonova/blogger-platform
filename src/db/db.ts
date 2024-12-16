import {BlogDBType, DBType, PostDBType} from "../types";
import {Db, MongoClient} from "mongodb";
import {SETTINGS} from "../settings";

export const client = new MongoClient(SETTINGS.MONGO_URI);
const db = client.db('blogger-platform');
export const blogsCollection = db.collection<BlogDBType>('blogs');
export const postsCollection = db.collection<PostDBType>('posts');

export const runDb = async () => {
    try {
        await client.connect();
        await db.command({ ping: 1 });
        console.log('Successfully connected to mongo server');
    }
    catch {
        console.log('Cannot connect to mongo server');
        await client.close();
    }
};

export const setDb = async (dataset?: Partial<DBType>, db?: Db) => {
    let blogsCol = blogsCollection;
    let postsCol = postsCollection;

    if (db) {
        blogsCol = db.collection<BlogDBType>('blogs');
        postsCol = db.collection<PostDBType>('posts');
    }

    if (!dataset) {
        await blogsCol.drop();
        await postsCol.drop();
        return;
    }

    if (dataset.blogs) {
        await blogsCol.drop();
        await blogsCol.insertMany(dataset.blogs);
    }

    if (dataset.posts) {
        await postsCol.drop();
        await postsCol.insertMany(dataset.posts);
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
