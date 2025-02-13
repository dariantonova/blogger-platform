import {APIErrorResult, RequestWithBody, UserDBType} from "../../types/types";
import {Request, Response} from "express";
import {AuthService} from "./auth.service";
import {HTTP_STATUSES} from "../../utils";
import {
    LoginInputModel,
    LoginSuccessViewModel,
    MeViewModel, NewPasswordRecoveryInputModel,
    PasswordRecoveryInputModel,
    RegistrationConfirmationCodeModel,
    RegistrationEmailResending,
    TokenPair
} from "./types/auth.types";
import {CreateUserInputModel} from "../users/models/CreateUserInputModel";
import {ResultStatus} from "../../common/result/resultStatus";
import {resultStatusToHttp} from "../../common/result/resultStatusToHttp";
import {JwtService} from "../../application/jwt.service";
import {inject, injectable} from "inversify";

const defaultIp = 'Unknown';
const defaultDeviceName = 'Unknown';

@injectable()
export class AuthController {
    constructor(
        @inject(AuthService) protected authService: AuthService,
        @inject(JwtService) protected jwtService: JwtService
    ) {}

    async loginUser(req: RequestWithBody<LoginInputModel>,
                     res: Response<LoginSuccessViewModel>) {
        const ip = req.ip || defaultIp;
        const deviceName = req.headers['user-agent'] || defaultDeviceName;

        const result = await this.authService.loginUser(
            req.body.loginOrEmail, req.body.password, deviceName, ip
        );

        if (result.status !== ResultStatus.SUCCESS) {
            res.sendStatus(resultStatusToHttp(result.status));
            return;
        }

        const tokenPair = result.data as TokenPair;

        await this._sendTokenPair(res, tokenPair);
    };
    async getCurrentUserInfo(req: Request, res: Response<MeViewModel>) {
        const user = req.user as UserDBType;
        const userInfo = new MeViewModel(
            user.email,
            user.login,
            user.id
        );
        res.json(userInfo);
    };
    async registerUser(req: RequestWithBody<CreateUserInputModel>,
                        res: Response<APIErrorResult>) {
        const registerUserResult = await this.authService.registerUser(
            req.body.login, req.body.email, req.body.password
        );

        if (registerUserResult.status !== ResultStatus.SUCCESS) {
            const error: APIErrorResult = {
                errorsMessages: registerUserResult.extensions,
            };
            res
                .status(resultStatusToHttp(registerUserResult.status))
                .json(error);
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    };
    async confirmRegistration(req: RequestWithBody<RegistrationConfirmationCodeModel>,
                               res: Response<APIErrorResult>) {
        const result = await this.authService.confirmRegistration(req.body.code);

        if (result.status !== ResultStatus.SUCCESS) {
            const error = new APIErrorResult(result.extensions);
            res
                .status(resultStatusToHttp(result.status))
                .json(error);
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    };
    async resendRegistrationEmail(req: RequestWithBody<RegistrationEmailResending>,
                                   res: Response<APIErrorResult>) {
        const result = await this.authService.resendRegistrationEmail(req.body.email);

        if (result.status !== ResultStatus.SUCCESS) {
            const error = new APIErrorResult(result.extensions);
            res
                .status(resultStatusToHttp(result.status))
                .json(error);
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    };
    async refreshToken(req: Request, res: Response<LoginSuccessViewModel>) {
        const tokenToRevoke = req.cookies.refreshToken;
        const user = req.user as UserDBType;
        const ip = req.ip || defaultIp;

        const result = await this.authService.refreshToken(tokenToRevoke, user, ip);
        if (result.status !== ResultStatus.SUCCESS) {
            res.sendStatus(resultStatusToHttp(result.status));
            return;
        }

        const tokenPair = result.data as TokenPair;

        await this._sendTokenPair(res, tokenPair);
    };
    async _sendTokenPair(res: Response<LoginSuccessViewModel>,
                          { accessToken, refreshToken }: TokenPair) {
        const refTokenPayload = await this.jwtService.decodeRefreshToken(refreshToken);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            expires: new Date(refTokenPayload.exp * 1000),
            path: '/auth',
        });

        res.json({ accessToken });
    };
    async logoutUser(req: Request, res: Response) {
        const tokenToRevoke = req.cookies.refreshToken;

        const result = await this.authService.logoutUser(tokenToRevoke);
        if (result.status !== ResultStatus.SUCCESS) {
            res.sendStatus(resultStatusToHttp(result.status));
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    };
    async requestPasswordRecovery(req: RequestWithBody<PasswordRecoveryInputModel>,
                                  res: Response) {
        const result = await this.authService.requestPasswordRecovery(req.body.email);

        if (result.status !== ResultStatus.SUCCESS) {
            res.status(resultStatusToHttp(result.status));
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    };
    async confirmPasswordRecovery(req: RequestWithBody<NewPasswordRecoveryInputModel>,
                                  res: Response) {
        const result = await this.authService.confirmPasswordRecovery(req.body.newPassword, req.body.recoveryCode);

        if (result.status !== ResultStatus.SUCCESS) {
            res.sendStatus(resultStatusToHttp(result.status));
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    };
}