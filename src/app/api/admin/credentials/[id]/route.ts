import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import {
  CredentialPlatform,
  CredentialType,
  Prisma,
  type ExternalCredential,
} from "@prisma/client";
import { encryptCredential, isEncrypted } from "@/lib/encryption";

export const runtime = "nodejs";

type SanitizedCredential = Omit<ExternalCredential, "value">;

const UNAUTHORIZED_RESPONSE = NextResponse.json({ error: "未授权" }, { status: 401 });

function sanitize(credential: ExternalCredential): SanitizedCredential {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { value: _value, ...rest } = credential;
  return rest;
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

function parseMetadata(metadata: unknown): Prisma.InputJsonObject | null {
  if (!metadata) return null;
  if (typeof metadata === "string") {
    const trimmed = metadata.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed) as Prisma.InputJsonObject;
    } catch {
      throw new Error("Metadata must be valid JSON");
    }
  }
  if (typeof metadata === "object") {
    return metadata as Prisma.InputJsonObject;
  }
  throw new Error("Unsupported metadata format");
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("UNAUTHORIZED");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await prisma.externalCredential.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return UNAUTHORIZED_RESPONSE;
    }
    console.error("Failed to delete credential:", error);
    return NextResponse.json(
      { error: "Failed to delete credential" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const body = await request.json().catch(() => {
      throw new Error("Invalid JSON payload");
    });

    const { platform, type, value, metadata, autoSync, syncFrequency, isValid } = body ?? {};

    const existing = await prisma.externalCredential.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }

    const data: Prisma.ExternalCredentialUpdateInput = {
      updatedAt: new Date(),
    };

    if (platform) {
      validateEnum(platform, CredentialPlatform, "platform");
      data.platform = platform;
    }

    if (type) {
      validateEnum(type, CredentialType, "type");
      data.type = type;
    }

    if (typeof isValid === "boolean") {
      data.isValid = isValid;
      data.lastValidatedAt = new Date();
    }

    if (metadata !== undefined) {
      const parsedMetadata = parseMetadata(metadata);
      data.metadata = parsedMetadata ?? Prisma.JsonNull;
    }

    if (autoSync !== undefined) {
      data.autoSync = Boolean(autoSync);
    }

    if (syncFrequency !== undefined) {
      data.syncFrequency = typeof syncFrequency === "string" ? syncFrequency : null;
    }

    if (value) {
      data.value = isEncrypted(value) ? value : encryptCredential(value);
    }

    const updated = await prisma.externalCredential.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ success: true, credential: sanitize(updated) });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return UNAUTHORIZED_RESPONSE;
    }

    if (error instanceof Error && error.message === "Invalid JSON payload") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof Error && error.message.startsWith("Invalid")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Failed to update credential:", error);
    return NextResponse.json(
      { error: "Failed to update credential" },
      { status: 500 }
    );
  }
}
