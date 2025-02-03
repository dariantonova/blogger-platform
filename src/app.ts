import express from 'express';
import {SETTINGS} from "./settings";
import {blogsRouter} from "./features/blogs/blogs.router";
import {testsRouter} from "./routes/tests.router";
import {postsRouter} from "./features/posts/posts.router";
import {usersRouter} from "./features/users/users.router";
import {authRouter} from "./features/auth/auth.router";
import {commentsRouter} from "./features/comments/comments.router";
import cookieParser from "cookie-parser";
import {securityDevicesRouter} from "./features/security-devices/security-devices.router";

const app = express();

const jsonBodyMiddleware = express.json();
app.use(jsonBodyMiddleware);
app.use(cookieParser());
app.set('trust proxy', true);

app.use(SETTINGS.PATH.BLOGS, blogsRouter);
app.use(SETTINGS.PATH.POSTS, postsRouter);
app.use(SETTINGS.PATH.USERS, usersRouter);
app.use(SETTINGS.PATH.COMMENTS, commentsRouter);
app.use(SETTINGS.PATH.SECURITY_DEVICES, securityDevicesRouter);

app.use(SETTINGS.PATH.AUTH, authRouter);
app.use(SETTINGS.PATH.TESTING, testsRouter);

export { app };