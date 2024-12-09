import {config} from 'dotenv';

config();

export const SETTINGS = {
    PORT: process.env.PORT || 3003,
    PATH: {
        BLOGS: '/api/blogs',
        POSTS: '/api/posts',
    }
}