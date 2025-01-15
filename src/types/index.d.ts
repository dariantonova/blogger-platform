import {UserDBType} from "./types";

declare global {
    declare namespace Express {
        export interface Request {
            user: UserDBType | null,
        }
    }
}