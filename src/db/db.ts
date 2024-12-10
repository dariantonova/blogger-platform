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

    db.blogs = dataset.blogs?.slice() || db.blogs;
    db.posts = dataset.posts?.slice() || db.posts;
};

const blogs: BlogDBType[] = [
    {
        id: '1',
        name: 'blog 1',
        description: 'superblog 1',
        websiteUrl: 'https://superblog.com/1',
    },
    {
        id: '2',
        name: 'blog 2',
        description: 'superblog 2',
        websiteUrl: 'https://superblog.com/2',
    },
];

const posts: PostDBType[] = [
    {
        id: '1',
        title: 'post 1',
        shortDescription: 'superpost 1',
        content: 'content of superpost 1',
        blogId: '2',
    },
    {
        id: '2',
        title: 'post 2',
        shortDescription: 'superpost 2',
        content: 'content of superpost 2',
        blogId: '1',
    },
];

setDB({
    blogs,
    posts
});