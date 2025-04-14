// app/api/auth/reset-password/route.ts
import { resetPassword } from '@/lib/actions/user.actions';
import { NextRequest, NextResponse } from 'next/server';
import { z } from "zod";

// Schema for password reset
const ResetPasswordSchema = z.object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters")
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate the request
        const validatedFields = ResetPasswordSchema.safeParse(body);

        if (!validatedFields.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid input"
                },
                { status: 400 }
            );
        }

        const { token, newPassword } = validatedFields.data;

        // Process the password reset
        const result = await resetPassword({ token, newPassword });

        return NextResponse.json(
            {
                success: result.success,
                message: result.success
                    ? "Password has been reset successfully"
                    : result.error || "Something went wrong"
            },
            { status: result.success ? 200 : 400 }
        );
    } catch (error) {
        console.error("Password reset error:", error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "An unknown error occurred"
            },
            { status: 500 }
        );
    }
}