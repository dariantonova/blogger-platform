import {BlogDBType, PostDBType} from "../src/types";
import {UpdateBlogInputModel} from "../src/features/blogs/models/UpdateBlogInputModel";
import {UpdatePostInputModel} from "../src/features/posts/models/UpdatePostInputModel";

export const blogs: BlogDBType[] = [
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

export const blogsWithDeleted: BlogDBType[] = [
    {
        id: '1',
        name: 'blog 1',
        description: 'superblog 1',
        websiteUrl: 'https://superblog.com/1',
        isDeleted: true,
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
]

export const blogsDataForUpdate: UpdateBlogInputModel[] = [
    {
        name: 'blog 3',
        description: 'superblog 3',
        websiteUrl: 'https://superblog.com/3',
    },
];

export const posts: PostDBType[] = [
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

export const postsWithDeleted: PostDBType[] = [
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
        isDeleted: true,
        createdAt: '2024-12-16T05:32:26.882Z',
    },
];

export const postsDataForUpdate: UpdatePostInputModel[] = [
    {
        title: 'post 3',
        shortDescription: 'superpost 3',
        content: 'content of superpost 3',
        blogId: '1',
    },
];