import { Resend } from 'resend';
import { getSetting } from '@/lib/actions/setting.actions';
import { getUserByEmail } from '@/lib/actions/user.actions';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(to: string, subject: string, html: string) {
    try {
        await resend.emails.send({
            from: 'Collection Online Shop <Noreply@resend.dev>',
            to,
            subject,
            html,
        });
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
        throw new Error('Failed to send email');
    }
}

export async function sendVerificationEmail(email: string, token: string) {
    const user = await getUserByEmail(email);
    if (!user) {
        throw new Error('User not found');
    }

    const { site: { url: siteUrl } } = await getSetting();
    const verificationLink = `${siteUrl}/auth/verify-email?token=${token}`;

    await sendEmail(
        email,
        'Verify Your Email',
        `<p>Please click the link below to verify your email (expires in 24 hours):</p><a href="${verificationLink}">${verificationLink}</a>`
    );
}

export async function sendResetPasswordEmail(email: string, token: string) {
    const user = await getUserByEmail(email);
    if (!user) {
        throw new Error('User not found');
    }

    const { site: { url: siteUrl } } = await getSetting();
    const resetLink = `${siteUrl}/reset-password?token=${token}`;
    console.log(resetLink);
    console.log(email);
    await sendEmail(
        email,
        'Reset Your Password',
        `<p>Please click the link below to reset your password (expires in 24 hours):</p><a href="${resetLink}">${resetLink}</a>`
    );

}
