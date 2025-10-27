/**
 * Credential Validation API
 * POST /api/admin/credentials/:id/validate
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isEncrypted, decryptCredential } from "@/lib/encryption";
import { validateCredential } from "@/lib/credential-validation";
import type { Prisma } from "@prisma/client";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // Fetch credential from database
    const credential = await prisma.externalCredential.findUnique({
      where: { id },
    });

    if (!credential) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }

    // Validate credential
    const resolvedValue = isEncrypted(credential.value)
      ? decryptCredential(credential.value)
      : credential.value;

    const validationResult = await validateCredential(
      credential.platform,
      credential.type,
      resolvedValue
    );

    // Prepare update data
    const updateData: Prisma.ExternalCredentialUpdateInput = {
      isValid: validationResult.isValid,
      lastValidatedAt: new Date(),
      lastError: validationResult.error || null,
      updatedAt: new Date(),
    };

    // If validation returned metadata (e.g., userId for Douban), merge it with existing metadata
    if (validationResult.metadata) {
      const existingMetadata = (credential.metadata as Record<string, unknown>) || {};
      updateData.metadata = {
        ...existingMetadata,
        ...validationResult.metadata,
      } as Prisma.InputJsonValue;
    }

    // Update credential in database
    await prisma.externalCredential.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      validation: validationResult,
    });
  } catch (error) {
    console.error("Credential validation error:", error);
    return NextResponse.json(
      {
        error: "Failed to validate credential",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
