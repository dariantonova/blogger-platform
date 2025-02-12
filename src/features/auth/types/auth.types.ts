export type LoginInputModel = {
    loginOrEmail: string,
    password: string,
};

export type LoginSuccessViewModel = {
    accessToken: string,
};

export class MeViewModel {
    constructor(public email: string,
                public login: string,
                public userId: string
    ) {}
}

export type RegistrationConfirmationCodeModel = {
    code: string,
};

export type RegistrationEmailResending = {
    email: string,
};

export class TokenPair {
    constructor(public accessToken: string,
                public refreshToken: string
    ) {}
}

export class DeviceAuthSessionDBType {
    constructor(public userId: string,
                public deviceId: string,
                public iat: Date,
                public deviceName: string,
                public ip: string,
                public exp: Date
    ) {}
}

export class DeviceViewModel {
    constructor(public ip: string,
                public title: string,
                public lastActiveDate: string,
                public deviceId: string
    ) {}
}

export type PasswordRecoveryInputModel = {
    email: string,
};

export type NewPasswordRecoveryInputModel = {
    newPassword: string,
    recoveryCode: string,
};