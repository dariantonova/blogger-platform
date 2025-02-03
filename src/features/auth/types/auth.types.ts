export type LoginInputModel = {
    loginOrEmail: string,
    password: string,
};

export type LoginSuccessViewModel = {
    accessToken: string,
};

export type MeViewModel = {
    email: string,
    login: string,
    userId: string,
};

export type RegistrationConfirmationCodeModel = {
    code: string,
};

export type RegistrationEmailResending = {
    email: string,
};

export type TokenPair = {
    accessToken: string,
    refreshToken: string,
};

export type RefreshSessionDTO = {
    userId: string,
    deviceId: string,
    iat: Date,
    deviceName: string,
    ip: string,
    exp: Date,
};

export type RefreshSessionDbType = {
    userId: string,
    deviceId: string,
    iat: Date,
    deviceName: string,
    ip: string,
    exp: Date,
};