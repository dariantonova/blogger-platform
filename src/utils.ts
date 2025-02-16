import {randomUUID} from "node:crypto";

export enum HTTP_STATUSES {
    OK_200 = 200,
    CREATED_201 = 201,
    NO_CONTENT_204 = 204,

    BAD_REQUEST_400 = 400,
    UNAUTHORIZED_401 = 401,
    FORBIDDEN_403 = 403,
    NOT_FOUND_404 = 404,
    TOO_MANY_REQUESTS_429 = 429,

    INTERNAL_SERVER_ERROR_500 = 500,
}

export const encodeToBase64 = (data: string) => {
    return Buffer.from(data).toString('base64');
}

export const generateUniqueCode = () => {
    return randomUUID();
}