/**
 * Test AI Diagnostics API
 * POST /api/test-ai
 * 
 * This endpoint allows testing the DeepSeek AI integration
 * by manually triggering diagnostics for sync errors
 */

import { NextRequest, NextResponse } from "next/server";
import { diagnoseError, generateSelectors, suggestFix } from "@/lib/ai/sync-assistant";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action = 'diagnose', platform, error, html } = body;

        switch (action) {
            case 'diagnose': {
                if (!platform || !error) {
                    return NextResponse.json(
                        { error: 'Missing required fields: platform, error' },
                        { status: 400 }
                    );
                }

                const diagnosis = await diagnoseError(
                    new Error(error),
                    platform,
                    html ? { html: html.substring(0, 2000) } : undefined
                );

                return NextResponse.json({
                    success: true,
                    action: 'diagnose',
                    result: diagnosis,
                });
            }

            case 'selectors': {
                if (!platform || !html) {
                    return NextResponse.json(
                        { error: 'Missing required fields: platform, html' },
                        { status: 400 }
                    );
                }

                const selectors = await generateSelectors(
                    platform,
                    html,
                    ['title', 'link', 'watchedAt', 'cover', 'progress'] // target fields
                );

                return NextResponse.json({
                    success: true,
                    action: 'selectors',
                    result: selectors,
                });
            }

            case 'suggest': {
                if (!platform || !error) {
                    return NextResponse.json(
                        { error: 'Missing required fields: platform, error' },
                        { status: 400 }
                    );
                }

                // Note: suggestFix requires SyncErrorDiagnosis, not raw error string
                // We need to first diagnose, then suggest fix
                const diagnosis = await diagnoseError(
                    new Error(error),
                    platform,
                    html ? { html } : undefined
                );

                if (!diagnosis) {
                    return NextResponse.json({
                        success: false,
                        action: 'suggest',
                        error: 'Unable to diagnose error first',
                    });
                }

                const suggestion = await suggestFix(
                    platform,
                    diagnosis
                );

                return NextResponse.json({
                    success: true,
                    action: 'suggest',
                    result: suggestion,
                });
            }

            default:
                return NextResponse.json(
                    { error: `Unknown action: ${action}` },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('AI test error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'AI test failed',
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
