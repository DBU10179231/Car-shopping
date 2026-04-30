const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Using ethereal for testing (fake SMTP)
    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: process.env.SMTP_USER || 'fake@ethereal.email',
            pass: process.env.SMTP_PASS || 'fakepassword',
        },
    });

    const message = {
        from: `${process.env.FROM_NAME || 'AutoMarket'} <${process.env.FROM_EMAIL || 'noreply@automarket.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    const info = await transporter.sendMail(message);
    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
};

module.exports = sendEmail;
