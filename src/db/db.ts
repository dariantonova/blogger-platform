import {AttemptDBType, BlogDBType, DBType, PostDBType, UserDBType} from "../types/types";
import {Collection, MongoClient, WithId} from "mongodb";
import {SETTINGS} from "../settings";
import {CommentDBType} from "../features/comments/comments.types";
import {DeviceAuthSessionDBType} from "../features/auth/types/auth.types";
import * as mongoose from "mongoose";

const { Schema }  = mongoose;

const blogSchema = new Schema<WithId<BlogDBType>>({
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    websiteUrl: { type: String, required: true },
    isDeleted: { type: Boolean, required: true },
    createdAt: { type: String, required: true },
    isMembership: { type: Boolean, required: true },
});

const postSchema = new Schema<WithId<PostDBType>>({
    id: { type: String, required: true },
    title: { type: String, required: true },
    shortDescription: { type: String, required: true },
    content: { type: String, required: true },
    blogId: { type: String, required: true },
    blogName: { type: String, required: true },
    isDeleted: { type: Boolean, required: true },
    createdAt: { type: String, required: true },
});

const userSchema = new Schema<WithId<UserDBType>>({
    id: { type: String, required: true },
    login: { type: String, required: true },
    email: { type: String, required: true },
    createdAt: { type: Date, required: true },
    passwordHash: { type: String, required: true },
    confirmationInfo: {
        confirmationCode: { type: String, default: '' },
        expirationDate: { type: Date, required: true },
        isConfirmed: { type: Boolean, required: true },
    },
    isDeleted: { type: Boolean, required: true },
});

const commentSchema = new Schema<WithId<CommentDBType>>({
    content: { type: String, required: true },
    postId: { type: String, required: true },
    commentatorInfo: {
        userId: { type: String, required: true },
        userLogin: { type: String, required: true },
    },
    createdAt: { type: String, required: true },
    isDeleted: { type: Boolean, required: true },
});

const deviceAuthSessionSchema = new Schema<WithId<DeviceAuthSessionDBType>>({
    userId: { type: String, required: true },
    deviceId: { type: String, required: true },
    iat: { type: Date, required: true },
    deviceName: { type: String, required: true },
    ip: { type: String, required: true },
    exp: { type: Date, required: true },
});

const attemptSchema = new Schema<WithId<AttemptDBType>>({
    ip: { type: String, required: true },
    url: { type: String, required: true },
    date: { type: Date, required: true },
});

export const BlogModel = mongoose.model('blogs', blogSchema);
export const PostModel = mongoose.model('posts', postSchema);
export const UserModel = mongoose.model('users', userSchema);
export const CommentModel = mongoose.model('comments', commentSchema);
export const DeviceAuthSessionModel = mongoose.model('device-auth-sessions', deviceAuthSessionSchema);
export const AttemptModel = mongoose.model('attempts', attemptSchema);

export let client: MongoClient;
export let blogsCollection: Collection<BlogDBType>;
export let postsCollection: Collection<PostDBType>;
export let usersCollection: Collection<UserDBType>;
export let commentsCollection: Collection<CommentDBType>;
export let deviceAuthSessionsCollection: Collection<DeviceAuthSessionDBType>;
export let attemptsCollection: Collection<AttemptDBType>;

export const runDb = async (url: string): Promise<boolean> => {
    try {
        const urlDelimiter = url.endsWith('/') ? '' : '/';

        await mongoose.connect(url + urlDelimiter + SETTINGS.DB_NAME);
        console.log('Successfully connected to mongo server via Mongoose');

        client = new MongoClient(url);
        const db = client.db(SETTINGS.DB_NAME);

        blogsCollection = db.collection<BlogDBType>('blogs');
        postsCollection = db.collection<PostDBType>('posts');
        usersCollection = db.collection<UserDBType>('users');
        commentsCollection = db.collection<CommentDBType>('comments');
        deviceAuthSessionsCollection = db.collection<DeviceAuthSessionDBType>('device-auth-sessions');
        attemptsCollection = db.collection<AttemptDBType>('attempts');

        await client.connect();
        await db.command({ ping: 1 });
        console.log('Successfully connected to mongo server via MongoClient');
        return true;
    }
    catch {
        console.log('Cannot connect to mongo server');
        await client.close();
        await mongoose.disconnect();
        return false;
    }
};

export const setDb = async (dataset?: Partial<DBType>) => {
    if (!dataset) {
        await blogsCollection.drop();
        await postsCollection.drop();
        await usersCollection.drop();
        await commentsCollection.drop();
        await deviceAuthSessionsCollection.drop();
        await attemptsCollection.drop();
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

    if (dataset.deviceAuthSessions) {
        await deviceAuthSessionsCollection.drop();
        if (dataset.deviceAuthSessions.length > 0) {
            const deviceAuthSessionsToInsert = dataset.deviceAuthSessions[0]._id ?
                dataset.deviceAuthSessions : structuredClone(dataset.deviceAuthSessions);
            await deviceAuthSessionsCollection.insertMany(deviceAuthSessionsToInsert);
        }
    }

    if (dataset.attempts) {
        await attemptsCollection.drop();
        if (dataset.attempts.length > 0) {
            const attemptsToInsert = dataset.attempts[0]._id ?
                dataset.attempts : structuredClone(dataset.attempts);
            await attemptsCollection.insertMany(attemptsToInsert);
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
const deviceAuthSessions: DeviceAuthSessionDBType[] = [];
const attempts: AttemptDBType[] = [];

export const initialDb: DBType = {
    blogs,
    posts,
    users,
    comments,
    deviceAuthSessions,
    attempts,
};
