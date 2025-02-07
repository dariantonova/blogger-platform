import {Request} from 'express';
import {CommentDBType} from "../features/comments/comments.types";
import {OptionalId} from "mongodb";
import {DeviceAuthSessionDBType} from "../features/auth/types/auth.types";

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

export type ConfirmationInfoType = {
    confirmationCode: string,
    expirationDate: Date,
    isConfirmed: boolean,
};

export type UserDBType = {
    id: string,
    login: string,
    email: string,
    createdAt: Date,
    passwordHash: string,
    confirmationInfo: ConfirmationInfoType,
    isDeleted: boolean,
};

export type AttemptDBType = {
    ip: string,
    url: string,
    date: Date,
};

export type DBType = {
    blogs: OptionalId<BlogDBType>[],
    posts: OptionalId<PostDBType>[],
    users: OptionalId<UserDBType>[],
    comments: OptionalId<CommentDBType>[],
    deviceAuthSessions: OptionalId<DeviceAuthSessionDBType>[],
    attempts: OptionalId<AttemptDBType>[],
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