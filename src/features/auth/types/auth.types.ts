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

export type RefreshSessionDTO = {
    userId: string,
    refreshToken: string,
    expirationDate: Date,
};

export type RefreshSessionDbType = {
    userId: string,
    refreshToken: string,
    expirationDate: Date,
};