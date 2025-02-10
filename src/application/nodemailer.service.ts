import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
    },
});

transporter.verify(function (error) {
    if (error) {
        console.log(error);
    } else {
        console.log("Mail server is ready to take our messages");
    }
});

export class NodemailerService {
    async sendEmail(email: string, subject: string, message: string) {
        const mail = {
            from: `DaricioDeveloper <${process.env.EMAIL}>`,
            to: email,
            subject,
            html: message,
        };

        return transporter.sendMail(mail);
    };
}