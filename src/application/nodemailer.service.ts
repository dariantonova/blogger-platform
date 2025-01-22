import nodemailer from 'nodemailer';
import {SETTINGS} from "../settings";

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: SETTINGS.EMAIL.USER,
        pass: SETTINGS.EMAIL.PASS,
    },
});

transporter.verify(function (error, success) {
    if (error) {
        console.log(error);
    } else {
        console.log("Mail server is ready to take our messages");
    }
});

export const nodemailerService = {
    async sendEmail(email: string, subject: string, message: string) {
        const mail = {
            from: `DaricioDeveloper <${SETTINGS.EMAIL.USER}>`,
            to: email,
            subject,
            html: message,
        };

        return transporter.sendMail(mail);
    },
};