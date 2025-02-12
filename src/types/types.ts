import {Request} from 'express';
import {CommentDBType} from "../features/comments/comments.types";
import {OptionalId} from "mongodb";
import {DeviceAuthSessionDBType} from "../features/auth/types/auth.types";

export type RequestWithBody<T> = Request<{}, {}, T>;
export type RequestWithParams<T> = Request<T>;
export type RequestWithParamsAndBody<T, B> = Request<T, {}, B>;
export type RequestWithQuery<T> = Request<{}, {}, {}, T>;
export type RequestWithParamsAndQuery<T, B> = Request<T, {}, {}, B>;

export class FieldError {
    constructor(public field: string | null,
                public message: string | null
    ) {}
}

export class APIErrorResult {
    constructor(public errorsMessages: FieldError[] | null
    ) {}
}

export class BlogDBType {
    constructor(public id: string,
                public name: string,
                public description: string,
                public websiteUrl: string,
                public isDeleted: boolean,
                public createdAt: string,
                public isMembership: boolean
    ) {}
}

export class PostDBType {
    constructor(public id: string,
                public title: string,
                public shortDescription: string,
                public content: string,
                public blogId: string,
                public blogName: string,
                public isDeleted: boolean,
                public createdAt: string
    ) {}
}

export class ConfirmationInfoType {
    constructor(public confirmationCode: string,
                public expirationDate: Date,
                public isConfirmed: boolean
    ) {}
}

export class PasswordRecoveryInfo {
    constructor(public recoveryCodeHash: string,
                public expirationDate: Date
    ) {}
}

export class UserDBType {
    constructor(public id: string,
                public login: string,
                public email: string,
                public createdAt: Date,
                public passwordHash: string,
                public confirmationInfo: ConfirmationInfoType,
                public passwordRecoveryInfo: PasswordRecoveryInfo,
                public isDeleted: boolean
    ) {}
}

export class AttemptDBType {
    constructor(public ip: string,
                public url: string,
                public date: Date
    ) {}
}

export class DBType {
    constructor(public blogs: OptionalId<BlogDBType>[],
                public posts: OptionalId<PostDBType>[],
                public users: OptionalId<UserDBType>[],
                public comments: OptionalId<CommentDBType>[],
                public deviceAuthSessions: OptionalId<DeviceAuthSessionDBType>[],
                public attempts: OptionalId<AttemptDBType>[]
    ) {}
}

export enum SortDirections {
    ASC = 'asc',
    DESC = 'desc',
}

export class Paginator<T> {
    constructor(public items: T[],
                public pagesCount?: number,
                public page?: number,
                public pageSize?: number,
                public totalCount?: number
    ) {}
}