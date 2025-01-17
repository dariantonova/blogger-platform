import {BlogDBType, DBType, PostDBType, UserDBType} from "../types/types";
import {Collection, MongoClient} from "mongodb";
import {SETTINGS} from "../settings";
import {CommentDBType} from "../features/comments/comments.types";

export let client: MongoClient;
export let blogsCollection: Collection<BlogDBType>;
export let postsCollection: Collection<PostDBType>;
export let usersCollection: Collection<UserDBType>;
export let commentsCollection: Collection<CommentDBType>;

export const runDb = async (url: string): Promise<boolean> => {
    try {
        client = new MongoClient(url);
        const db = client.db(SETTINGS.DB_NAME);

        blogsCollection = db.collection<BlogDBType>('blogs');
        postsCollection = db.collection<PostDBType>('posts');
        usersCollection = db.collection<UserDBType>('users');
        commentsCollection = db.collection<CommentDBType>('comments');

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
        await usersCollection.drop();
        await commentsCollection.drop();
        return;
    }

    if (dataset.blogs) {
        await blogsCollection.drop();
        if (dataset.blogs.length > 0) {
            await blogsCollection.insertMany(structuredClone(dataset.blogs));
        }
    }

    if (dataset.posts) {
        await postsCollection.drop();
        if (dataset.posts.length > 0) {
            await postsCollection.insertMany(structuredClone(dataset.posts));
        }
    }

    if (dataset.users) {
        await usersCollection.drop();
        if (dataset.users.length > 0) {
            await usersCollection.insertMany(structuredClone(dataset.users));
        }
    }

    if (dataset.comments) {
        await commentsCollection.drop();
        if (dataset.comments.length > 0) {
            const commentsToInsert = dataset.comments[0]._id ?
                dataset.comments : structuredClone(dataset.comments);
            await commentsCollection.insertMany(commentsToInsert);
        }
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
];

const users: UserDBType[] = [];
const comments: CommentDBType[] = [];

export const initialDb: DBType = {
    blogs,
    posts,
    users,
    comments,
};
