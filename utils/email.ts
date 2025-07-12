import { getSetting } from '@/lib/actions/setting.actions';
import { getUserByEmail } from '@/lib/actions/user.actions';
import { APP_NAME, RESEND_API_KEY, SENDER_EMAIL } from '@/lib/constants';
import { addHours } from 'date-fns'; // Import addHours for easier date manipulation
import { format, toZonedTime } from 'date-fns-tz';
import { Timezone } from 'next-intl'; // Ensure this import is correct based on your setup
import { Resend } from 'resend';

const resend = new Resend(RESEND_API_KEY as string);

async function sendEmail(to: string, subject: string, html: string) {
    try {
        const response = await resend.emails.send({
            from: `${APP_NAME} <${SENDER_EMAIL}>`, // Use a verified sender
            to,
            subject,
            html,
        });
        if (response.error) {
            console.error(`Resend error sending to ${to}:`, response.error);
            throw new Error('Failed to send email via Resend');
        }
        console.log(`Email sent successfully to ${to}`);
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
        throw new Error('Failed to send email');
    }
}

export async function sendVerificationEmail(email: string, token: string) {
    try {
        const user = await getUserByEmail(email); // This function currently throws an error if user not found, so no need for if(!user) check here.

        const { site: { url: siteUrl, name: siteName } } = await getSetting();

        const verificationLink = `${siteUrl}/verify-email/${token}`;

        // Calculate expiry time (24 hours from now)
        const tokenExpiryUtc = addHours(new Date(), 24);

        // Convert expiry to user's local timezone if available, otherwise use a default (e.g., 'Asia/Phnom_Penh')
        // Assuming your user object might have a timeZone field, if not, it will default.
        const timeZone = (user as { timeZone?: string }).timeZone || 'Asia/Phnom_Penh';
        const zonedDate = toZonedTime(tokenExpiryUtc, timeZone);
        const formattedExpiry = format(zonedDate, 'PPP p zzz', { timeZone: timeZone as Timezone }); // Example: "Oct 27, 2023 10:30 AM PDT"

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verify Your Email Address</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9; }
                    .header { text-align: center; padding-bottom: 20px; }
                    .header h1 { color: #007bff; }
                    .content { margin-bottom: 20px; }
                    .button-container { text-align: center; margin-top: 30px; margin-bottom: 30px; }
                    .button { background-color: #007bff; color: white !important; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block; }
                    .footer { text-align: center; font-size: 0.9em; color: #777; margin-top: 20px; }
                    .expiry-note { font-size: 0.9em; color: #888; }
                    .logo { margin-bottom: 15px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                         <div class="logo">
                            <img src="${siteUrl}" alt="${siteName}" style="max-width: 150px; height: auto;">
                        </div>
                        <h1>Welcome to ${siteName}!</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${user.name || user.email},</p>
                        <p>Thank you for registering with ${siteName}. To activate your account and get started, Please confirm your email address by clicking the link below:</p>
                        <div class="button-container">
                            <a href="${verificationLink}" class="button">Verify My Email</a>
                        </div>
                        <p>Alternatively, you can copy and paste the following link into your web browser:</p>
                        <p><a href="${verificationLink}">${verificationLink}</a></p>
                        <p class="expiry-note">This verification link is valid for **24 hours** and will expire at **${formattedExpiry}** (${timeZone} time).</p>
                        <p>If you did not create an account with ${siteName}, please ignore this email.</p>
                        <p>Thanks,</p>
                        <p>The ${siteName} Team</p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        await sendEmail(
            email,
            `Verify Your Email Address for ${siteName}`, // More descriptive subject
            htmlContent
        );
    } catch (error) {
        console.error('Error sending verification email:', error);
        // Re-throw the error so `registerUserWithEmailVerification` can catch it
        throw error;
    }
}


export async function sendResetPasswordEmail(email: string, token: string) {
    try {
        const user = await getUserByEmail(email);
        // Note: getUserByEmail is expected to throw if user is not found,
        // so no explicit if(!user) check needed here.

        const { site: { url: siteUrl, name: siteName } } = await getSetting();

        const resetLink = `${siteUrl}/reset-password?token=${token}`;
        // The reset password token expiry should ideally come from the user object
        // that was updated in requestPasswordReset to store the exact expiry.
        // For now, assuming a 24-hour default if not available,
        // but it's best practice to pass the exact expiry from the DB.
        const tokenExpiryUtc = addHours(new Date(), 24); // This might be redundant if the expiry is always stored with the token.

        // Convert expiry to user's local timezone if available, otherwise use Asia/Phnom_Penh
        const timeZone = (user as { timeZone?: string }).timeZone || 'Asia/Phnom_Penh';
        const zonedDate = toZonedTime(tokenExpiryUtc, timeZone);
        const formattedExpiry = format(zonedDate, 'PPP p zzz', { timeZone: timeZone as Timezone });

        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset Request</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9; }
                    .header { text-align: center; padding-bottom: 20px; }
                    .header h1 { color: #d9534f; }
                    .content { margin-bottom: 20px; }
                    .button-container { text-align: center; margin-top: 30px; margin-bottom: 30px; }
                    .button { background-color: #d9534f; color: white !important; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block; }
                    .footer { text-align: center; font-size: 0.9em; color: #777; margin-top: 20px; }
                    .expiry-note { font-size: 0.9em; color: #888; }
                    .logo { margin-bottom: 15px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">
                            <img src="${siteUrl}/Collection.png" alt="${siteName}" style="max-width: 150px; height: auto;">
                        </div>
                        <h1>Password Reset for ${siteName}</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${user.name || user.email},</p>
                        <p>You recently requested to reset the password for your ${siteName} account. Please click the button below to reset it:</p>
                        <div class="button-container">
                            <a href="${resetLink}" class="button">Reset My Password</a>
                        </div>
                        <p>Alternatively, you can copy and paste the following link into your web browser:</p>
                        <p><a href="${resetLink}">${resetLink}</a></p>
                        <p class="expiry-note">This password reset link is valid for **24 hours** and will expire at **${formattedExpiry}** (${timeZone} time).</p>
                        <p>If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
                        <p>Thanks,</p>
                        <p>The ${siteName} Team</p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        await sendEmail(email, `Reset Your ${siteName} Password`, html);
    } catch (error) {
        console.error('Error sending reset password email:', error);
        throw error;
    }
}