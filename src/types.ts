import {Request} from 'express';

export type RequestWithBody<T> = Request<{}, {}, T>;
export type RequestWithParams<T> = Request<T>;
export type RequestWithParamsAndBody<T, B> = Request<T, {}, B>;

export type FieldError = {
    message: string | null,
    field: string | null,
};

export type APIErrorResult = {
    errorsMessages: FieldError[] | null,
};

export type BlogType = {
    id: string,
    name: string,
    description: string,
    websiteUrl: string,
};

export type PostType = {
    id: string,
    title: string,
    shortDescription: string,
    content: string,
    blogId: string,
};

export type DBType = {
    blogs: BlogType[],
    posts: PostType[],
};