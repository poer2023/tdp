/**
 * AI Diagnosis Logging Service
 * Handles storing and retrieving AI diagnostic logs
 */

import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface CreateAIDiagnosisInput {
    platform: string;
    errorType: string;
    errorMessage: string;
    htmlSnapshot?: string;

    aiReason: string;
    aiSolution: string;
    canAutoFix: boolean;
    confidence: number;

    tokensUsed?: number;
    costYuan?: number;

    credentialId?: string;
    syncJobId?: string;
}

export interface AutoFixUpdate {
    autoFixApplied: boolean;
    autoFixSuccess?: boolean;
    autoFixDetails?: Record<string, unknown>;
}

/**
 * Log an AI diagnosis result
 */
export async function logAIDiagnosis(input: CreateAIDiagnosisInput) {
    try {
        const log = await prisma.aIDiagnosisLog.create({
            data: {
                platform: input.platform,
                errorType: input.errorType,
                errorMessage: input.errorMessage,
                htmlSnapshot: input.htmlSnapshot,

                aiReason: input.aiReason,
                aiSolution: input.aiSolution,
                canAutoFix: input.canAutoFix,
                confidence: input.confidence,

                tokensUsed: input.tokensUsed,
                costYuan: input.costYuan,

                credentialId: input.credentialId,
                syncJobId: input.syncJobId,
            },
        });

        console.log(`[AI Log] Diagnosis logged: ${log.id} for ${input.platform}`);
        return log;
    } catch (error) {
        console.error('[AI Log] Failed to log diagnosis:', error);
        throw error;
    }
}

/**
 * Update auto-fix status for a diagnosis log
 */
export async function updateAutoFixStatus(
    logId: string,
    update: AutoFixUpdate
) {
    try {
        const log = await prisma.aIDiagnosisLog.update({
            where: { id: logId },
            data: {
                autoFixApplied: update.autoFixApplied,
                autoFixSuccess: update.autoFixSuccess,
                autoFixDetails: update.autoFixDetails as Prisma.InputJsonValue,
            },
        });

        console.log(`[AI Log] Auto-fix status updated: ${logId}`);
        return log;
    } catch (error) {
        console.error('[AI Log] Failed to update auto-fix status:', error);
        throw error;
    }
}

/**
 * Get recent AI diagnosis logs
 */
export async function getRecentDiagnosisLogs(limit = 50) {
    return prisma.aIDiagnosisLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
}

/**
 * Get AI diagnosis logs for a specific platform
 */
export async function getDiagnosisLogsByPlatform(platform: string, limit = 50) {
    return prisma.aIDiagnosisLog.findMany({
        where: { platform },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
}

/**
 * Get AI diagnosis statistics
 */
export async function getAIDiagnosisStats() {
    const [totalLogs, autoFixableLogs, appliedFixes, successfulFixes, totalCost] = await Promise.all([
        prisma.aIDiagnosisLog.count(),
        prisma.aIDiagnosisLog.count({ where: { canAutoFix: true } }),
        prisma.aIDiagnosisLog.count({ where: { autoFixApplied: true } }),
        prisma.aIDiagnosisLog.count({
            where: {
                autoFixApplied: true,
                autoFixSuccess: true,
            },
        }),
        prisma.aIDiagnosisLog.aggregate({
            _sum: { costYuan: true },
        }),
    ]);

    return {
        totalDiagnoses: totalLogs,
        autoFixable: autoFixableLogs,
        fixesApplied: appliedFixes,
        fixesSuccessful: successfulFixes,
        totalCostYuan: totalCost._sum.costYuan || 0,
    };
}
