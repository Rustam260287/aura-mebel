declare module 'gltf-pipeline' {
  export type DracoOptions = {
    compressionLevel?: number;
    quantizePositionBits?: number;
    quantizeNormalBits?: number;
    quantizeTexcoordBits?: number;
    quantizeColorBits?: number;
    quantizeGenericBits?: number;
    unifiedQuantization?: boolean;
    uncompressedFallback?: boolean;
  };

  export type ProcessOptions = {
    dracoOptions?: DracoOptions;
    separate?: boolean;
    separateTextures?: boolean;
    keepUnusedElements?: boolean;
    stats?: boolean;
    resourceDirectory?: string;
    allowAbsolute?: boolean;
    logger?: (message: string) => void;
  };

  export type ProcessResults = {
    glb: Buffer;
    separateResources?: Record<string, Buffer>;
  };

  export interface GltfPipelineApi {
    processGlb(glb: Buffer | Uint8Array | ArrayBuffer, options?: ProcessOptions): Promise<ProcessResults>;
    processGltf(gltf: unknown, options?: ProcessOptions): Promise<{ gltf: unknown; separateResources?: Record<string, Buffer> }>;
    glbToGltf(glb: Buffer | Uint8Array | ArrayBuffer, options?: unknown): Promise<{ gltf: unknown }>;
    gltfToGlb(gltf: unknown, options?: ProcessOptions): Promise<ProcessResults>;
    getStatistics(gltf: unknown): unknown;
  }

  const gltfPipeline: GltfPipelineApi;
  export default gltfPipeline;

  export function getStatistics(gltf: unknown): unknown;
}

