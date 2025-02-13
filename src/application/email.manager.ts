import {NodemailerService} from "./nodemailer.service";
import {inject, injectable} from "inversify";

@injectable()
export class EmailManager {
    constructor(
        @inject(NodemailerService) protected nodemailerService: NodemailerService
    ) {}

    async sendRegistrationMessage(email: string, confirmationCode: string) {
        const subject = 'Finish registration';
        const message =
            ' <h1>Thank you for your registration</h1>\n' +
            ' <p>To finish registration please follow the link below:\n' +
            `     <a href='https://somesite.com/confirm-email?code=${confirmationCode}'>complete registration</a>\n`+
            ' </p>\n';
        return this.nodemailerService.sendEmail(email, subject, message);
    };
    async sendPasswordRecoveryMessage(email: string, recoveryCode: string) {
        const subject = 'Password recovery';
        const message =
            ' <h1>Password recovery</h1>\n' +
            ' <p>To finish password recovery please follow the link below:\n' +
            `     <a href='https://somesite.com/password-recovery?recoveryCode=${recoveryCode}'>recover password</a>\n`+
            ' </p>\n';
        return this.nodemailerService.sendEmail(email, subject, message);
    };
}