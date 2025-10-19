/**
 * Credential Validation API
 * POST /api/admin/credentials/:id/validate
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateCredential } from "@/lib/credential-validation";

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
    const validationResult = await validateCredential(
      credential.platform,
      credential.type,
      credential.value
    );

    // Update credential in database
    await prisma.externalCredential.update({
      where: { id },
      data: {
        isValid: validationResult.isValid,
        lastValidatedAt: new Date(),
        lastError: validationResult.error || null,
        updatedAt: new Date(),
      },
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
