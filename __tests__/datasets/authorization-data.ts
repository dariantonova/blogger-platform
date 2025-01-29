import {SETTINGS} from "../../src/settings";
import {encodeToBase64} from "../../src/utils";

export const VALID_AUTH = 'Basic YWRtaW46cXdlcnR5';
const CREDENTIALS = SETTINGS.CREDENTIALS.LOGIN + ':' + SETTINGS.CREDENTIALS.PASSWORD;
export const defaultAccessTokenLife = '10s';
export const defaultRefreshTokenLife = '20s';

export const invalidAuthValues: string[] = [
    '',
    'Basic somethingWeird',
    'Basic ',
    `Bearer ${encodeToBase64(CREDENTIALS)}`,
    encodeToBase64(CREDENTIALS),
];