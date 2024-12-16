import {config} from 'dotenv';

config();

export const SETTINGS = {
    PORT: process.env.PORT || 3003,
    PATH: {
        BLOGS: '/api/blogs',
        POSTS: '/api/posts',
        TESTING: '/api/testing',
    },
    CREDENTIALS: {
        LOGIN: 'admin',
        PASSWORD: 'qwerty',
    },
    MONGO_URI: process.env.mongoURI || 'mongodb://0.0.0.0:27017',
}