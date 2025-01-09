import express from 'express';
import {SETTINGS} from "./settings";
import {blogsRouter} from "./features/blogs/blogs.router";
import {testsRouter} from "./routes/tests.router";
import {postsRouter} from "./features/posts/posts.router";
import {usersRouter} from "./features/users/users.router";

const app = express();

const jsonBodyMiddleware = express.json();
app.use(jsonBodyMiddleware);

app.use(SETTINGS.PATH.BLOGS, blogsRouter);
app.use(SETTINGS.PATH.POSTS, postsRouter);
app.use(SETTINGS.PATH.USERS, usersRouter);

app.use(SETTINGS.PATH.TESTING, testsRouter);

export { app };