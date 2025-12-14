export class AIError extends Error {
  readonly cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'AIError';
    this.cause = options?.cause;
  }
}

export class AIConfigError extends AIError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'AIConfigError';
  }
}

export function toErrorMessage(error: unknown, fallback = 'AI request failed') {
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

