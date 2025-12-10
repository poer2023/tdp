import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/profile/google-avatar
 * Fetch the original Google profile picture for the current user
 */
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Find the Google account for this user
        const account = await prisma.account.findFirst({
            where: {
                userId: session.user.id,
                provider: "google",
            },
            select: {
                access_token: true,
                id_token: true,
            },
        });

        if (!account) {
            return NextResponse.json(
                { error: "No Google account linked" },
                { status: 404 }
            );
        }

        // Try to get the avatar from Google UserInfo API using the access token
        if (account.access_token) {
            try {
                const response = await fetch(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    {
                        headers: {
                            Authorization: `Bearer ${account.access_token}`,
                        },
                    }
                );

                console.log("Google UserInfo API response status:", response.status);

                if (response.ok) {
                    const userInfo = await response.json();
                    console.log("Google UserInfo:", JSON.stringify(userInfo, null, 2));
                    if (userInfo.picture) {
                        return NextResponse.json({ avatarUrl: userInfo.picture });
                    }
                } else {
                    console.log("Google UserInfo API failed, status:", response.status);
                }
            } catch (err) {
                console.log("Google UserInfo API error:", err);
                // Access token might be expired, try to decode id_token
            }
        }

        // Fallback: Try to decode the id_token to get the picture
        if (account.id_token) {
            try {
                // JWT format: header.payload.signature
                const parts = account.id_token.split(".");
                if (parts.length === 3) {
                    const payload = JSON.parse(
                        Buffer.from(parts[1]!, "base64url").toString("utf-8")
                    );
                    if (payload.picture) {
                        return NextResponse.json({ avatarUrl: payload.picture });
                    }
                }
            } catch {
                // Failed to decode id_token
            }
        }

        return NextResponse.json(
            { error: "Could not retrieve Google avatar" },
            { status: 404 }
        );
    } catch (err) {
        console.error("Google avatar fetch error:", err);
        return NextResponse.json(
            { error: "Failed to fetch Google avatar" },
            { status: 500 }
        );
    }
}
