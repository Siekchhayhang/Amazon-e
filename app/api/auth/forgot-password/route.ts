// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/actions/user.actions";
import { z } from "zod";

// Simple schema to validate the email
const EmailSchema = z.object({
    email: z.string().email("Invalid email address"),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate the email
        const validatedFields = EmailSchema.safeParse(body);

        if (!validatedFields.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid email address"
                },
                { status: 400 }
            );
        }

        const { email } = validatedFields.data;

        // Request password reset and send email
        const result = await requestPasswordReset(email);

        return NextResponse.json(
            {
                success: result.success,
                message: result.success
                    ? "Password reset email sent. Please check your inbox."
                    : result.error || "Something went wrong"
            },
            { status: result.success ? 200 : 400 }
        );
    } catch (error) {
        console.error("Password reset request error:", error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "An unknown error occurred"
            },
            { status: 500 }
        );
    }
}