/**
 * Admin Credentials API
 *  - GET /api/admin/credentials: List credentials (sanitized)
 *  - POST /api/admin/credentials: Create credential (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import {
  CredentialPlatform,
  CredentialType,
  Prisma,
  type ExternalCredential,
} from "@prisma/client";
import { encryptCredential, isEncrypted } from "@/lib/encryption";
import { withDbFallback } from "@/lib/utils/db-fallback";

type SanitizedCredential = Omit<ExternalCredential, "value">;

const UNAUTHORIZED_RESPONSE = NextResponse.json({ error: "未授权" }, { status: 401 });

function sanitizeCredential(credential: ExternalCredential): SanitizedCredential {
  // Exclude sensitive value from response
  const { value: _value, ...rest } = credential;
  return rest;
}

function parseMetadata(metadata: unknown): Record<string, unknown> | null {
  if (!metadata) return null;
  if (typeof metadata === "string") {
    const trimmed = metadata.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed);
    } catch {
      throw new Error("Metadata must be valid JSON");
    }
  }
  if (typeof metadata === "object") {
    return metadata as Record<string, unknown>;
  }
  throw new Error("Unsupported metadata format");
}

function validateEnum<T extends { [key: string]: string }>(
  value: unknown,
  enumObject: T,
  field: string
): asserts value is T[keyof T] {
  if (!value || typeof value !== "string" || !Object.values(enumObject).includes(value)) {
    throw new Error(`Invalid ${field}: ${value as string}`);
  }
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("UNAUTHORIZED");
  }
}

export async function GET() {
  try {
    await requireAdmin();

    const credentials = await withDbFallback(
      () =>
        prisma.externalCredential.findMany({
          orderBy: { createdAt: "desc" },
        }),
      () => [],
      "GET /api/admin/credentials"
    );

    return NextResponse.json({
      success: true,
      credentials: credentials.map(sanitizeCredential),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return UNAUTHORIZED_RESPONSE;
    }

    console.error("Failed to fetch credentials:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch credentials",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json().catch(() => {
      throw new Error("Invalid JSON payload");
    });

    const { platform, type, value, metadata } = body ?? {};

    if (typeof value !== "string" || value.trim().length === 0) {
      return NextResponse.json({ error: "Missing required field: value" }, { status: 400 });
    }

    validateEnum(platform, CredentialPlatform, "platform");
    validateEnum(type, CredentialType, "type");

    const parsedMetadata = parseMetadata(metadata);
    const now = new Date();
    const storedValue = isEncrypted(value) ? value : encryptCredential(value);

    const credential = await withDbFallback(
      () =>
        prisma.externalCredential.create({
          data: {
            id: randomUUID(),
            platform,
            type,
            value: storedValue,
            ...(parsedMetadata ? { metadata: parsedMetadata as Prisma.InputJsonValue } : {}),
            isValid: true,
            createdAt: now,
            updatedAt: now,
          },
        }),
      () => {
        throw new Error("Database unavailable - cannot create credential");
      },
      "POST /api/admin/credentials"
    );

    return NextResponse.json(
      {
        success: true,
        credential: sanitizeCredential(credential),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return UNAUTHORIZED_RESPONSE;
    }

    if (error instanceof Error && error.message === "Metadata must be valid JSON") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof Error && error.message === "Invalid JSON payload") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Credential with the same unique field already exists" },
          { status: 409 }
        );
      }
    }

    console.error("Failed to create credential:", error);
    return NextResponse.json(
      {
        error: "Failed to create credential",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
