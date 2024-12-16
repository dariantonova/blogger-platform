import {BlogDBType, DBType, PostDBType} from "../types";

export const db: DBType = {
    blogs: [],
    posts: [],
};

export const setDB = (dataset?: Partial<DBType>) => {
    if (!dataset) {
        db.blogs = [];
        db.posts = [];
        return;
    }

    db.blogs = dataset.blogs ? structuredClone(dataset.blogs) : db.blogs;
    db.posts = dataset.posts ? structuredClone(dataset.posts) : db.posts;
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

setDB({
    blogs,
    posts
});