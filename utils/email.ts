import { Resend } from 'resend';
import { getSetting } from '@/lib/actions/setting.actions';
import { getUserByEmail } from '@/lib/actions/user.actions';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(to: string, subject: string, html: string) {
    try {
        const response = await resend.emails.send({
            from: `Collection Online Shop <noreply@resend.dev>`, // Use a verified sender
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
        if (!user) {
            throw new Error('User not found');
        }

        const { site: { url: siteUrl } } = await getSetting();
        //Will implement this in the future
        const verificationLink = `${siteUrl}/verify-email?token=${token}`;

        await sendEmail(
            email,
            'Verify Your Email',
            `<p>Please click the link below to verify your email (expires in 24 hours):</p><a href="${verificationLink}">${verificationLink}</a>`
        );
    } catch (error) {
        console.error('Error sending verification email:', error);
        // Consider logging or handling this error more explicitly
        throw error;
    }
}

export async function sendResetPasswordEmail(email: string, token: string) {
    try {
        const user = await getUserByEmail(email);
        if (!user) {
            throw new Error('User not found');
        }

        const { site: { url: siteUrl } } = await getSetting();
        const resetLink = `${siteUrl}/reset-password?token=${token}`;
        console.log('Reset Link:', resetLink);
        console.log('Sending to:', email);

        await sendEmail(
            email,
            'Reset Your Password',
            `<p>Please click the link below to reset your password (expires in 24 hours):</p><a href="${resetLink}">${resetLink}</a>`
        );
    } catch (error) {
        console.error('Error sending reset password email:', error);
        throw error;
    }
}