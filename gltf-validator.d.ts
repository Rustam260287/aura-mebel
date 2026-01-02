declare module 'gltf-validator' {
  export type ValidateBytesOptions = Record<string, unknown>;
  export type ValidateBytesResult = {
    issues?: {
      numErrors?: number;
      numWarnings?: number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };

  export function validateBytes(
    data: Uint8Array,
    options?: ValidateBytesOptions,
  ): Promise<ValidateBytesResult>;
}

