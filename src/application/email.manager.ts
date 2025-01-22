import {nodemailerService} from "./nodemailer.service";

export const emailManager = {
    async sendRegistrationMessage(email: string, confirmationCode: string) {
        const subject = 'Finish registration';
        const message =
            ' <h1>Thank for your registration</h1>\n' +
            ' <p>To finish registration please follow the link below:\n' +
            `     <a href='https://somesite.com/confirm-email?code=${confirmationCode}'>complete registration</a>\n`+
            ' </p>\n';
        return nodemailerService.sendEmail(email, subject, message);
    },
};