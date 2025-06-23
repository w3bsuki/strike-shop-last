/**
 * Parallel fetching utilities for improved performance
 */

// Batch multiple requests and execute in parallel
export const parallelFetch = async <T>(
  requests: Array<() => Promise<T>>
): Promise<T[]> => {
  return Promise.all(requests.map(request => request()));
};

// Fetch with timeout to prevent hanging requests
export const fetchWithTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number = 5000
): Promise<T> => {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
  });

  return Promise.race([promise, timeout]);
};

// Retry failed requests with exponential backoff
export const retryFetch = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  throw lastError!;
};

// Batch API requests to reduce overhead
export class BatchRequestQueue<T> {
  private queue: Array<{
    key: string;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
  }> = [];
  private timeout: NodeJS.Timeout | null = null;
  private batchSize: number;
  private batchDelay: number;
  private batchProcessor: (keys: string[]) => Promise<Map<string, T>>;

  constructor(
    batchProcessor: (keys: string[]) => Promise<Map<string, T>>,
    batchSize = 10,
    batchDelay = 50
  ) {
    this.batchProcessor = batchProcessor;
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
  }

  async get(key: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ key, resolve, reject });
      this.scheduleBatch();
    });
  }

  private scheduleBatch() {
    if (this.timeout) return;

    this.timeout = setTimeout(() => {
      this.processBatch();
    }, this.batchDelay);
  }

  private async processBatch() {
    this.timeout = null;
    
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.batchSize);
    const keys = batch.map(item => item.key);

    try {
      const results = await this.batchProcessor(keys);
      
      batch.forEach(({ key, resolve, reject }) => {
        const result = results.get(key);
        if (result !== undefined) {
          resolve(result);
        } else {
          reject(new Error(`No result for key: ${key}`));
        }
      });
    } catch (error) {
      batch.forEach(({ reject }) => reject(error as Error));
    }

    // Process remaining items
    if (this.queue.length > 0) {
      this.scheduleBatch();
    }
  }
}