import express from 'express';
import {SETTINGS} from "./settings";
import {blogsRouter} from "./features/blogs/blogs.router";

const app = express();

const jsonBodyMiddleware = express.json();
app.use(jsonBodyMiddleware);

app.use(SETTINGS.PATH.BLOGS, blogsRouter);

export { app };