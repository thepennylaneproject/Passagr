// workers/retry.ts
// P-6.1: Shared retry utility with exponential backoff for transient failures.

export interface RetryOptions {
    maxRetries?: number;
    baseDelayMs?: number;
    label?: string;
}

export async function withRetry<T>(
    fn: () => Promise<T>,
    { maxRetries = 3, baseDelayMs = 500, label = 'operation' }: RetryOptions = {}
): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            if (attempt === maxRetries) throw err;
            const delay = baseDelayMs * Math.pow(2, attempt - 1);
            console.warn(`[retry] ${label} attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('unreachable');
}
