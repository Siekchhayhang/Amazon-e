import { getSetting } from '@/lib/actions/setting.actions';
import { getUserByEmail } from '@/lib/actions/user.actions';
import { addHours } from 'date-fns';
import { format, toZonedTime } from 'date-fns-tz';
import { Timezone } from 'next-intl';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an email using Resend with a dynamic from name.
 * @param fromName The name to display in the 'from' field (e.g., "YourApp Support").
 * @param to The recipient's email address.
 * @param subject The subject of the email.
 * @param html The HTML content of the email.
 */
async function sendEmail({
    fromName,
    to,
    subject,
    html,
}: {
    fromName: string;
    to: string;
    subject: string;
    html: string;
}) {
    try {
        // The email address part of 'from' must be a verified sender in Resend.
        const fromEmail = `noreply@${process.env.RESEND_VERIFIED_DOMAIN}`;

        const response = await resend.emails.send({
            from: `${fromName} <${fromEmail}>`,
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
        const user = await getUserByEmail(email);
        const { site: { url: siteUrl, name: siteName } } = await getSetting();
        const verificationLink = `${siteUrl}/verify-email?token=${token}`;
        const tokenExpiryUtc = addHours(new Date(), 24);
        const timeZone = (user as { timeZone?: string }).timeZone || 'Asia/Phnom_Penh';
        const zonedDate = toZonedTime(tokenExpiryUtc, timeZone);
        const formattedExpiry = format(zonedDate, 'PPP p zzz', { timeZone: timeZone as Timezone });

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
                      <img src="${siteUrl}/Collection.png" alt="${siteName}" style="max-width: 150px; height: auto;">
                  </div>
                  <h1>Welcome to ${siteName}!</h1>
              </div>
              <div class="content">
                  <p>Hello ${user.name || user.email},</p>
                  <p>Thank you for registering with ${siteName}. To activate your account and get started, please verify your email address by clicking the button below:</p>
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

        // ✨ Pass a specific "from name" for verification
        await sendEmail({
            fromName: `${siteName} Verification`,
            to: email,
            subject: `Verify Your Email Address for ${siteName}`,
            html: htmlContent,
        });

    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
}

export async function sendResetPasswordEmail(email: string, token: string) {
    try {
        const user = await getUserByEmail(email);
        const { site: { url: siteUrl, name: siteName } } = await getSetting();
        const resetLink = `${siteUrl}/reset-password?token=${token}`;
        const tokenExpiryUtc = addHours(new Date(), 24);
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

        // ✨ Pass a specific "from name" for password resets
        await sendEmail({
            fromName: `${siteName} Support`,
            to: email,
            subject: `Reset Your ${siteName} Password`,
            html,
        });

    } catch (error) {
        console.error('Error sending reset password email:', error);
        throw error;
    }
}
