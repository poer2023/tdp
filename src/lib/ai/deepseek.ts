/**
 * DeepSeek API Client
 * Wrapper for DeepSeek V3 API with streaming and error handling
 */

export interface DeepSeekMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface DeepSeekChatOptions {
    model?: 'deepseek-chat' | 'deepseek-reasoner';
    messages: DeepSeekMessage[];
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    stream?: boolean;
}

export interface DeepSeekChatResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export class DeepSeekClient {
    private apiKey: string;
    private baseUrl = 'https://api.deepseek.com/v1';

    constructor(apiKey: string) {
        if (!apiKey) {
            throw new Error('DeepSeek API key is required');
        }
        this.apiKey = apiKey;
    }

    /**
     * Chat completion with DeepSeek
     */
    async chat(options: DeepSeekChatOptions): Promise<DeepSeekChatResponse> {
        const {
            model = 'deepseek-chat',
            messages,
            temperature = 0.1, // Low temperature for deterministic output
            max_tokens = 2000,
            top_p = 0.95,
            stream = false,
        } = options;

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    messages,
                    temperature,
                    max_tokens,
                    top_p,
                    stream,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('[DeepSeek] API call failed:', error);
            throw error;
        }
    }

    /**
     * Get estimated cost in CNY for a completion
     */
    calculateCost(tokens: number): number {
        // DeepSeek pricing: ¥0.14 per million tokens (input + output)
        const pricePerMillionTokens = 0.14;
        return (tokens / 1_000_000) * pricePerMillionTokens;
    }
}

/**
 * Get DeepSeek client instance from environment or credential
 */
export async function getDeepSeekClient(): Promise<DeepSeekClient | null> {
    // First try environment variable
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (apiKey) {
        return new DeepSeekClient(apiKey);
    }

    // Then try database credential
    try {
        const { prisma } = await import('@/lib/prisma');
        const { decryptCredential, isEncrypted } = await import('@/lib/encryption');

        const credential = await prisma.externalCredential.findFirst({
            where: {
                platform: 'DEEPSEEK',
                isValid: true,
            },
        });

        if (credential) {
            const key = isEncrypted(credential.value)
                ? decryptCredential(credential.value)
                : credential.value;
            return new DeepSeekClient(key);
        }
    } catch (error) {
        console.error('[DeepSeek] Failed to load credential from database:', error);
    }

    return null;
}
