import {config} from 'dotenv';

config();

export const SETTINGS = {
    PORT: process.env.PORT || 3003,
    PATH: {
        BLOGS: '/api/blogs',
        POSTS: '/api/posts',
        TESTING: '/api/testing',
        USERS: '/api/users',
        AUTH: '/api/auth',
        COMMENTS: '/api/comments',
        SECURITY_DEVICES: '/api/security/devices',
    },
    CREDENTIALS: {
        LOGIN: 'admin',
        PASSWORD: 'qwerty',
    },
    MONGO_URL: process.env.MONGO_URL || 'mongodb://0.0.0.0:27017',
    DB_NAME: process.env.DB_NAME || 'test',
    ACCESS_JWT_SECRET: process.env.JWT_SECRET || '123',
    REFRESH_JWT_SECRET: process.env.REFRESH_JWT_SECRET || '123',
    RECOVERY_JWT_SECRET: process.env.RECOVERY_JWT_SECRET || '123',
    ACCESS_JWT_LIFE: '10s',
    REFRESH_JWT_LIFE: '20s',
    RECOVERY_JWT_LIFE: '1h',
}