/**
 * AI Sync Assistant
 * Helper functions for AI-assisted media sync debugging and recovery
 */

import { getDeepSeekClient } from './deepseek';

export interface SyncErrorDiagnosis {
    platform: string;
    reason: string;
    solution: string;
    canAutoFix: boolean;
    needsUserAction: boolean;
    confidence: number; // 0-1
}

export interface CSSSelectors {
    listContainer?: string;
    itemSelector?: string;
    title?: string;
    link?: string;
    watchedAt?: string;
    cover?: string;
    progress?: string;
    [key: string]: string | undefined;
}

/**
 * Diagnose sync error using AI
 */
export async function diagnoseError(
    error: Error | unknown,
    platform: string,
    additionalContext?: Record<string, unknown>
): Promise<SyncErrorDiagnosis | null> {
    const client = await getDeepSeekClient();
    if (!client) {
        console.warn('[AI] DeepSeek client not available, skipping diagnosis');
        return null;
    }

    try {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        const prompt = `作为技术专家，诊断这个${platform}数据同步失败的原因。

错误信息: ${errorMessage}
${errorStack ? `堆栈: ${errorStack.substring(0, 500)}` : ''}
${additionalContext ? `附加信息: ${JSON.stringify(additionalContext)}` : ''}

请返回 JSON 格式的诊断结果:
{
  "reason": "失败的根本原因（简洁）",
  "solution": "推荐的解决方案",
  "canAutoFix": true/false （是否可以自动修复）,
  "needsUserAction": true/false （是否需要用户操作）,
  "confidence": 0.0-1.0 （诊断的置信度）
}`;

        const response = await client.chat({
            messages: [
                { role: 'system', content: '你是一个专业的技术问题诊断助手。返回有效的 JSON，不要包含其他文字。' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.1,
            max_tokens: 500,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('Empty response from AI');
        }

        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const diagnosis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

        console.log(`[AI] Diagnosis completed for ${platform}:`, diagnosis);
        console.log(`[AI] Cost: ¥${client.calculateCost(response.usage.total_tokens).toFixed(4)}`);

        return {
            platform,
            ...diagnosis,
        };
    } catch (error) {
        console.error('[AI] Error diagnosis failed:', error);
        return null;
    }
}

/**
 * Generate CSS selectors from HTML using AI
 */
export async function generateSelectors(
    platform: string,
    htmlContent: string,
    targetFields: string[]
): Promise<CSSSelectors | null> {
    const client = await getDeepSeekClient();
    if (!client) {
        console.warn('[AI] DeepSeek client not available, skipping selector generation');
        return null;
    }

    try {
        // Truncate HTML to avoid token limits (keep first 8000 chars)
        const truncatedHTML = htmlContent.substring(0, 8000);

        const prompt = `分析这个${platform}页面的 HTML 结构，提取视频/内容列表的 CSS 选择器。

需要提取的字段: ${targetFields.join(', ')}

HTML 片段:
${truncatedHTML}

请返回 JSON 格式的选择器配置:
{
  "listContainer": "列表容器的选择器",
  "itemSelector": "单个项目的选择器",
  "title": "标题选择器",
  "link": "链接选择器",
  "watchedAt": "观看时间选择器",
  "cover": "封面图选择器（可选）",
  "progress": "进度选择器（可选）"
}

只返回 JSON，不要包含解释文字。`;

        const response = await client.chat({
            messages: [
                { role: 'system', content: '你是一个前端开发专家。返回有效的 JSON，不要包含其他文字。' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.1,
            max_tokens: 800,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('Empty response from AI');
        }

        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const selectors = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

        console.log(`[AI] Selectors generated for ${platform}:`, selectors);
        console.log(`[AI] Cost: ¥${client.calculateCost(response.usage.total_tokens).toFixed(4)}`);

        return selectors;
    } catch (error) {
        console.error('[AI] Selector generation failed:', error);
        return null;
    }
}

/**
 * Suggest fix for sync issue
 */
export async function suggestFix(
    platform: string,
    diagnosis: SyncErrorDiagnosis
): Promise<string | null> {
    const client = await getDeepSeekClient();
    if (!client) {
        return null;
    }

    try {
        const prompt = `基于这个诊断结果，给出具体的修复步骤：

平台: ${platform}
问题: ${diagnosis.reason}
初步方案: ${diagnosis.solution}

请给出详细的、可操作的修复步骤（3-5步）。`;

        const response = await client.chat({
            messages: [
                { role: 'system', content: '你是一个技术支持专家，提供清晰的步骤指导。' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 600,
        });

        const fixSteps = response.choices[0]?.message?.content;
        console.log(`[AI] Fix suggestion for ${platform} generated`);

        return fixSteps || null;
    } catch (error) {
        console.error('[AI] Fix suggestion failed:', error);
        return null;
    }
}
