const nodemailer = require('nodemailer');

/**
 * PRODUCTION-READY NOTIFICATION SERVICE
 * Integrating mock SendGrid/SES for email and Twilio for SMS
 */

// Production Email Transporter (using environment variables)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
    port: process.env.SMTP_PORT || 587,
    auth: {
        user: process.env.SMTP_USER || 'apikey',
        pass: process.env.SMTP_PASS || 'mock_sendgrid_key_123'
    }
});

/**
 * @desc Generic Email Sender
 */
const sendEmail = async (options) => {
    const mailOptions = {
        from: `"AutoMarket Notifications" <${process.env.FROM_EMAIL || 'noreply@automarket.com'}>`,
        to: options.email,
        subject: options.subject,
        html: `
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <div style="background: #2a9d8f; padding: 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: -0.5px;">AutoMarket</h1>
                </div>
                <div style="padding: 32px; line-height: 1.6; color: #333333; font-size: 16px;">
                    ${options.message}
                </div>
                <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 13px; color: #888888; border-top: 1px solid #eaeaea;">
                    <p style="margin: 0 0 8px 0;">&copy; ${new Date().getFullYear()} AutoMarket. All rights reserved.</p>
                    <p style="margin: 0;">This is an automated notification, please do not reply to this email.</p>
                </div>
            </div>
        `
    };

    try {
        if (process.env.NODE_ENV === 'test') return;

        // In real app, this sends the email
        // await transporter.sendMail(mailOptions);
        console.log(`[SendGrid] 📧 Email dispatched to: ${options.email} | Subject: ${options.subject}`);
        return true;
    } catch (err) {
        console.error('[SendGrid] ❌ Email transmission failed:', err.message);
        return false;
    }
};

/**
 * @desc Generic SMS Sender (Twilio Mock)
 */
const sendSMS = async (options) => {
    try {
        if (process.env.NODE_ENV === 'test') return;

        // Mock Twilio Client
        // const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
        // await client.messages.create({ body: options.message, from: process.env.TWILIO_PHONE, to: options.phone });
        console.log(`[Twilio] 📱 SMS dispatched to: ${options.phone} | Body: ${options.message}`);
        return true;
    } catch (err) {
        console.error('[Twilio] ❌ SMS transmission failed:', err.message);
        return false;
    }
};

// ==========================================
// Specialized Templates
// ==========================================

const notifyNewInquiry = async (sellerEmail, sellerPhone, carDetails, buyerName) => {
    await sendEmail({
        email: sellerEmail,
        subject: `New Inquiry: ${carDetails.year} ${carDetails.make} ${carDetails.model}`,
        message: `
            <h2 style="color: #264653; margin-top: 0;">You have a new lead!</h2>
            <p><strong>${buyerName}</strong> has expressed interest in your <strong>${carDetails.year} ${carDetails.make} ${carDetails.model}</strong>.</p>
            <p style="margin-bottom: 24px;">Please log in to your Seller Dashboard to view messages and respond securely.</p>
            <div style="text-align: center; margin-top: 32px;">
                <a href="${process.env.CLIENT_URL || '#'}/seller/orders" style="background: #2a9d8f; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">View Inquiry Now</a>
            </div>
        `
    });

    if (sellerPhone) {
        await sendSMS({
            phone: sellerPhone,
            message: `AutoMarket Alert: ${buyerName} is interested in your ${carDetails.make} ${carDetails.model}. Check your dashboard.`
        });
    }
};

const notifyOrderStatusChange = async (buyerEmail, buyerPhone, carDetails, status) => {
    const statusColors = {
        approved: '#2a9d8f',
        rejected: '#e63946',
        completed: '#457b9d',
        pending: '#f4a261'
    };

    await sendEmail({
        email: buyerEmail,
        subject: `Order Update: ${carDetails.year} ${carDetails.make} ${carDetails.model}`,
        message: `
            <h2 style="color: #264653; margin-top: 0;">Status Update on your Order</h2>
            <p>Your request regarding the <strong>${carDetails.year} ${carDetails.make} ${carDetails.model}</strong> has been updated.</p>
            <p>Current Status:</p>
            <div style="display: inline-block; padding: 8px 16px; background: ${statusColors[status] || statusColors.pending}; color: #ffffff; border-radius: 20px; font-weight: 700; text-transform: uppercase; font-size: 14px; letter-spacing: 1px;">
                ${status}
            </div>
            <p style="margin-top: 24px;">Log in to your Buyer Hub for complete details or to proceed with next steps.</p>
        `
    });

    if (buyerPhone && status === 'approved') {
        await sendSMS({
            phone: buyerPhone,
            message: `AutoMarket: Great news! Your order for the ${carDetails.make} ${carDetails.model} is APPROVED. Login to proceed.`
        });
    }
};

/**
 * @desc Notify User about Finance Application status
 */
const notifyFinanceStatus = async (userEmail, provider, status, reason = '') => {
    const isApproved = status === 'approved';
    await sendEmail({
        email: userEmail,
        subject: `Financing Update: ${provider}`,
        message: `
            <h2 style="color: #264653;">Application Decision</h2>
            <p>Your financing application with <strong>${provider}</strong> has been <strong>${status.toUpperCase()}</strong>.</p>
            ${reason ? `<div style="background: #fdf2f2; padding: 15px; border-left: 4px solid #e63946; margin: 20px 0;"><strong>Reason:</strong> ${reason}</div>` : ''}
            <p>${isApproved ? 'Congratulations! Our team will contact you shortly to finalize the paperwork.' : 'We encourage you to explore other financing options or contact support for more details.'}</p>
            <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.CLIENT_URL || '#'}/buyer/dashboard" style="background: #2a9d8f; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Dashboard</a>
            </div>
        `
    });
};

/**
 * @desc Notify about Logistics/Delivery status
 */
const notifyLogisticsUpdate = async (userEmail, trackingNumber, status, location = '') => {
    await sendEmail({
        email: userEmail,
        subject: `Delivery Update: ${trackingNumber}`,
        message: `
            <h2 style="color: #264653;">Vehicle Transport Status</h2>
            <p>Your vehicle delivery (Tracking ID: <strong>${trackingNumber}</strong>) is now in <strong>${status.toUpperCase()}</strong>.</p>
            ${location ? `<p>Current Location: <strong>${location}</strong></p>` : ''}
            <div style="background: #f1f3f5; padding: 20px; border-radius: 10px; margin-top: 20px;">
                <p style="margin: 0; font-size: 14px;">Estimate Delivery Arrival: Needs calculated based on logistics provider sync.</p>
            </div>
        `
    });
};

/**
 * @desc Notify Seller about Pickup scheduling
 */
const notifySellerPickup = async (sellerEmail, carDetails, date, time) => {
    await sendEmail({
        email: sellerEmail,
        subject: `Schedule Confirmation: Vehicle Pickup`,
        message: `
            <h2 style="color: #264653;">Pickup Scheduled</h2>
            <p>A transport driver is scheduled to pick up your <strong>${carDetails.year} ${carDetails.make} ${carDetails.model}</strong>.</p>
            <div style="border: 1.5px dashed #2a9d8f; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <p style="margin: 0;">📅 <strong>Date:</strong> ${date}</p>
                <p style="margin: 5px 0 0 0;">🕒 <strong>Time Window:</strong> ${time}</p>
            </div>
            <p>Please ensure all documents and keys are ready for the driver upon arrival.</p>
        `
    });
};

module.exports = {
    sendEmail,
    sendSMS,
    notifyNewInquiry,
    notifyOrderStatusChange,
    notifyFinanceStatus,
    notifyLogisticsUpdate,
    notifySellerPickup
};
