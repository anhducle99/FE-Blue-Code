import { networkService } from "../services/nativeService";
import { AxiosRequestConfig, AxiosResponse } from "axios";

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  retryCondition?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  retryCondition: (error) => {
    return (
      !error.response ||
      (error.response.status >= 500 && error.response.status < 600)
    );
  },
};

export async function retryApiCall<T>(
  apiCall: () => Promise<AxiosResponse<T>>,
  options: RetryOptions = {}
): Promise<AxiosResponse<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const networkStatus = await networkService.getStatus();
      if (!networkStatus.connected && attempt < opts.maxRetries) {
        await waitForNetwork(opts.retryDelay * (attempt + 1));
        continue;
      }

      return await apiCall();
    } catch (error: any) {
      lastError = error;

      if (attempt >= opts.maxRetries || !opts.retryCondition(error)) {
        throw error;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, opts.retryDelay * (attempt + 1))
      );
    }
  }

  throw lastError;
}

async function waitForNetwork(maxWait: number = 5000): Promise<void> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const checkInterval = 500;

    const checkNetwork = async () => {
      const status = await networkService.getStatus();
      if (status.connected || Date.now() - startTime >= maxWait) {
        resolve();
        return;
      }
      setTimeout(checkNetwork, checkInterval);
    };

    checkNetwork();
  });
}

export function withRetry<T>(
  apiCall: () => Promise<AxiosResponse<T>>,
  options?: RetryOptions
): Promise<AxiosResponse<T>> {
  return retryApiCall(apiCall, options);
}
