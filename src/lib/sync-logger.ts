/**
 * Sync Logging Service
 * Handles creating and querying sync operation logs
 */

import prisma from "@/lib/prisma";
import type { SyncTriggerType, SyncStatus, Prisma } from "@prisma/client";
import type { SyncResult } from "@/lib/media-sync";

export interface CreateSyncLogInput {
    credentialId?: string;
    platform: string;
    triggerType: SyncTriggerType;
    syncConfig?: Record<string, unknown>;
}

export interface UpdateSyncLogInput {
    status: SyncStatus;
    success: boolean;

    itemsTotal?: number;
    itemsSuccess?: number;
    itemsFailed?: number;
    itemsNew?: number;
    itemsUpdated?: number;
    itemsExisting?: number;

    duration?: number;
    errorMessage?: string;
    errorStack?: string;

    aiDiagnosisId?: string;
    aiAssisted?: boolean;
}

/**
 * Start a new sync log entry
 */
export async function startSyncLog(input: CreateSyncLogInput) {
    try {
        const log = await prisma.syncLog.create({
            data: {
                credentialId: input.credentialId,
                platform: input.platform,
                triggerType: input.triggerType,
                syncConfig: input.syncConfig as Prisma.InputJsonValue,
                status: 'RUNNING',
                startedAt: new Date(),
            },
        });

        console.log(`[Sync Log] Started: ${log.id} for ${input.platform}`);
        return log;
    } catch (error) {
        console.error('[Sync Log] Failed to start log:', error);
        throw error;
    }
}

/**
 * Complete a sync log with results
 */
export async function completeSyncLog(
    logId: string,
    result: SyncResult
) {
    try {
        const log = await prisma.syncLog.update({
            where: { id: logId },
            data: {
                status: result.success ? 'SUCCESS' : 'FAILED',
                success: result.success,

                itemsTotal: result.itemsTotal || 0,
                itemsSuccess: result.itemsSuccess || 0,
                itemsFailed: result.itemsFailed || 0,
                itemsNew: result.itemsNew || 0,
                itemsUpdated: 0, // Will be calculated from itemsNew
                itemsExisting: result.itemsExisting || 0,

                duration: result.duration,
                errorMessage: result.error,
                errorStack: result.errorStack,

                completedAt: new Date(),
            },
        });

        console.log(`[Sync Log] Completed: ${logId} - ${result.success ? 'SUCCESS' : 'FAILED'}`);
        return log;
    } catch (error) {
        console.error('[Sync Log] Failed to complete log:', error);
        throw error;
    }
}

/**
 * Get recent sync logs
 */
export async function getRecentSyncLogs(limit = 50) {
    return prisma.syncLog.findMany({
        include: {
            credential: {
                select: {
                    id: true,
                    platform: true,
                    metadata: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
}

/**
 * Get sync logs by credential
 */
export async function getSyncLogsByCredential(credentialId: string, limit = 50) {
    return prisma.syncLog.findMany({
        where: { credentialId },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
}

/**
 * Get sync logs by platform
 */
export async function getSyncLogsByPlatform(platform: string, limit = 50) {
    return prisma.syncLog.findMany({
        where: { platform },
        include: {
            credential: {
                select: {
                    id: true,
                    metadata: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
}

/**
 * Get sync statistics
 */
export async function getSyncStats() {
    const [
        totalSyncs,
        successfulSyncs,
        failedSyncs,
        manualSyncs,
        autoSyncs,
        avgDuration,
        totalItems,
    ] = await Promise.all([
        prisma.syncLog.count(),
        prisma.syncLog.count({ where: { success: true } }),
        prisma.syncLog.count({ where: { success: false } }),
        prisma.syncLog.count({ where: { triggerType: 'MANUAL' } }),
        prisma.syncLog.count({ where: { triggerType: 'AUTO' } }),
        prisma.syncLog.aggregate({
            _avg: { duration: true },
            where: { duration: { not: null } },
        }),
        prisma.syncLog.aggregate({
            _sum: {
                itemsTotal: true,
                itemsNew: true,
                itemsSuccess: true,
            },
        }),
    ]);

    return {
        totalSyncs,
        successfulSyncs,
        failedSyncs,
        successRate: totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0,
        manualSyncs,
        autoSyncs,
        avgDurationMs: avgDuration._avg.duration || 0,
        totalItemsSynced: totalItems._sum.itemsTotal || 0,
        totalNewItems: totalItems._sum.itemsNew || 0,
        totalSuccessItems: totalItems._sum.itemsSuccess || 0,
    };
}
