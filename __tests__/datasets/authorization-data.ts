import {SETTINGS} from "../../src/settings";
import {encodeToBase64} from "../../src/utils";

export const VALID_AUTH = 'Basic YWRtaW46cXdlcnR5';
const CREDENTIALS = SETTINGS.CREDENTIALS.LOGIN + ':' + SETTINGS.CREDENTIALS.PASSWORD;
export const defaultAccessTokenLife = '5m';
export const defaultRefreshTokenLife = '24h';

export const invalidAuthValues: string[] = [
    '',
    'Basic somethingWeird',
    'Basic ',
    `Bearer ${encodeToBase64(CREDENTIALS)}`,
    encodeToBase64(CREDENTIALS),
];