// lib/auth/require-admin.ts
import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Ensures the user is an admin; redirects if not.
 */
export async function requireAdmin() {
    const session = await auth();

    if (!session || session.user.role !== "Admin") {
        redirect("/access-denied");
    }

    return session;
}
