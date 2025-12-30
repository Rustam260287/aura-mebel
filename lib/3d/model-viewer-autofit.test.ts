import { autofitModelViewer } from './model-viewer-autofit';

const parseOrbitRadius = (value: string) => {
  const m = value.match(/(-?\d+(?:\.\d+)?)m$/);
  if (!m) throw new Error(`Invalid orbit: ${value}`);
  return Number(m[1]);
};

const expectedRadius = (params: {
  width: number;
  height: number;
  depth: number;
  maxDimension: number;
  aspect: number;
  fovDeg: number;
  paddingFactor: number;
}) => {
  const scale = 1 / params.maxDimension;
  const fovRad = (params.fovDeg * Math.PI) / 180;
  const halfV = Math.tan(fovRad / 2);
  const halfH = Math.tan(fovRad / 2) * params.aspect;

  const scaledWidth = params.width * scale;
  const scaledHeight = params.height * scale;
  const scaledDepth = params.depth * scale;
  const effectiveWidth = Math.hypot(scaledWidth, scaledDepth);
  const effectiveHeight = Math.hypot(scaledHeight, scaledDepth);

  const distanceForHeight = (effectiveHeight / 2) / halfV;
  const distanceForWidth = (effectiveWidth / 2) / halfH;
  return Math.max(distanceForHeight, distanceForWidth) * params.paddingFactor;
};

describe('autofitModelViewer', () => {
  const rect = { width: 800, height: 600 };

  const makeEl = (dimensions: { x: number; y: number; z: number }) => {
    const attrs = new Map<string, string>();
    return {
      getDimensions: () => dimensions,
      getBoundingClientRect: () => rect,
      setAttribute: (k: string, v: string) => attrs.set(k, v),
      getAttribute: (k: string) => attrs.get(k) ?? null,
      jumpCameraToGoal: jest.fn(),
      __attrs: attrs,
    } as any;
  };

  it('normalizes a small model to targetSize=1', () => {
    const el = makeEl({ x: 0.2, y: 0.2, z: 0.2 });
    const result = autofitModelViewer(el, { targetSize: 1, paddingFactor: 1.18, fovDeg: 30 });
    expect(result).not.toBeNull();
    expect(result!.scale).toBeCloseTo(5, 6);
    expect(result!.maxDimension * result!.scale).toBeCloseTo(1, 6);
    expect(el.__attrs.get('bounds')).toBe('tight');
    expect(el.__attrs.get('camera-target')).toBe('auto auto auto');
  });

  it('fits a wide model without clipping (aspect-aware)', () => {
    const el = makeEl({ x: 3, y: 1, z: 0.5 });
    const result = autofitModelViewer(el, { targetSize: 1, paddingFactor: 1.18, fovDeg: 30 });
    expect(result).not.toBeNull();
    expect(result!.scale).toBeCloseTo(1 / 3, 6);

    const orbit = el.__attrs.get('camera-orbit');
    expect(orbit).toContain('0deg 75deg');
    const radius = parseOrbitRadius(orbit!);
    const expected = expectedRadius({
      width: 3,
      height: 1,
      depth: 0.5,
      maxDimension: 3,
      aspect: rect.width / rect.height,
      fovDeg: 30,
      paddingFactor: 1.18,
    });
    expect(radius).toBeCloseTo(expected, 3);
  });

  it('fits a tall model without clipping', () => {
    const el = makeEl({ x: 0.5, y: 4, z: 0.5 });
    const result = autofitModelViewer(el, { targetSize: 1, paddingFactor: 1.18, fovDeg: 30 });
    expect(result).not.toBeNull();
    expect(result!.scale).toBeCloseTo(0.25, 6);

    const orbit = el.__attrs.get('camera-orbit');
    expect(orbit).toContain('0deg 75deg');
    const radius = parseOrbitRadius(orbit!);
    const expected = expectedRadius({
      width: 0.5,
      height: 4,
      depth: 0.5,
      maxDimension: 4,
      aspect: rect.width / rect.height,
      fovDeg: 30,
      paddingFactor: 1.18,
    });
    expect(radius).toBeCloseTo(expected, 3);
  });
});
