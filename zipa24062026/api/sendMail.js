var nodemailer = require('nodemailer');

const SMTPServer = process.env.SMTP_HOST || 'mail.zipaphoto.net';
const SMTPPort = parseInt(process.env.SMTP_PORT || '25', 10);
const SMTPUsername = process.env.SMTP_USER || 'noreply@zipaphoto.net';
const SMTPPassword = process.env.SMTP_PASSWORD;


module.exports = function (to, subject, html) {
    var transporter = nodemailer.createTransport({
        host: SMTPServer,
        port: SMTPPort,
        secure: false,
        //requireTLS: true,
        auth: {
            user: SMTPUsername,
            pass: SMTPPassword
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    
    var mailOptions = {
        from: SMTPUsername,
        to: to,
        subject: subject,
        html: html
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}