import {Request} from 'express';
import {CommentType} from "../features/comments/comments.types";

export type RequestWithBody<T> = Request<{}, {}, T>;
export type RequestWithParams<T> = Request<T>;
export type RequestWithParamsAndBody<T, B> = Request<T, {}, B>;
export type RequestWithQuery<T> = Request<{}, {}, {}, T>;
export type RequestWithParamsAndQuery<T, B> = Request<T, {}, {}, B>;

export type FieldError = {
    message: string | null,
    field: string | null,
};

export type APIErrorResult = {
    errorsMessages: FieldError[] | null,
};

export type BlogDBType = {
    id: string,
    name: string,
    description: string,
    websiteUrl: string,
    isDeleted: boolean,
    createdAt: string,
    isMembership: boolean,
};

export type PostDBType = {
    id: string,
    title: string,
    shortDescription: string,
    content: string,
    blogId: string,
    blogName: string,
    isDeleted: boolean,
    createdAt: string,
};

export type UserDBType = {
    id: string,
    login: string,
    email: string,
    createdAt: string,
    passwordHash: string,
    isDeleted: boolean,
};

export type DBType = {
    blogs: BlogDBType[],
    posts: PostDBType[],
    users: UserDBType[],
    comments: CommentType[],
};

export enum SortDirections {
    ASC = 'asc',
    DESC = 'desc',
}

export type Paginator<T> = {
    pagesCount?: number,
    page?: number,
    pageSize?: number,
    totalCount?: number,
    items: T[],
};