import {BlogDBType} from "../src/types";
import {UpdateBlogInputModel} from "../src/features/blogs/models/UpdateBlogInputModel";

export const blogs: BlogDBType[] = [
    {
        id: '1',
        name: 'blog 1',
        description: 'superblog 1',
        websiteUrl: 'https://superblog.com/1',
        isDeleted: false,
    },
    {
        id: '2',
        name: 'blog 2',
        description: 'superblog 2',
        websiteUrl: 'https://superblog.com/2',
        isDeleted: false,
    },
];

export const blogsDataForUpdate: UpdateBlogInputModel[] = [
    {
        name: 'blog 3',
        description: 'superblog 3',
        websiteUrl: 'https://superblog.com/3',
    },
];