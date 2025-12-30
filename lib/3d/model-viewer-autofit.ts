type Vec3 = { x: number; y: number; z: number };

const toNumber = (value: unknown): number | null => {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
};

const parseDeg = (value: unknown, fallback: number): number => {
  if (typeof value !== 'string') return fallback;
  const m = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*deg$/i);
  const n = toNumber(m?.[1]);
  return n == null ? fallback : n;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const ensureFinite = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback);

const vec3FromUnknown = (value: unknown): Vec3 | null => {
  if (!value || typeof value !== 'object') return null;
  const v = value as Partial<Vec3>;
  const x = toNumber(v.x);
  const y = toNumber(v.y);
  const z = toNumber(v.z);
  if (x == null || y == null || z == null) return null;
  return { x, y, z };
};

export type ModelViewerAutofitResult = {
  width: number;
  height: number;
  depth: number;
  maxDimension: number;
  scale: number;
  cameraRadius: number;
};

export type ModelViewerAutofitOptions = {
  targetSize?: number;
  paddingFactor?: number;
  fovDeg?: number;
  thetaDeg?: number;
  phiDeg?: number;
  thetaRangeDeg?: number;
  minPhiDeg?: number;
  maxPhiDeg?: number;
  minRadiusFactor?: number;
  maxRadiusFactor?: number;
};

export function autofitModelViewer(
  element: any,
  options: ModelViewerAutofitOptions = {},
): ModelViewerAutofitResult | null {
  if (!element) return null;

  const getDims = typeof element.getDimensions === 'function' ? element.getDimensions.bind(element) : null;
  const dims = vec3FromUnknown(getDims?.());
  if (!dims) return null;

  const width = Math.abs(dims.x);
  const height = Math.abs(dims.y);
  const depth = Math.abs(dims.z);
  const maxDimension = Math.max(width, height, depth);
  if (!Number.isFinite(maxDimension) || maxDimension <= 0) return null;

  const targetSize = ensureFinite(options.targetSize ?? 1, 1);
  const scale = targetSize / maxDimension;
  if (Number.isFinite(scale) && scale > 0) {
    element.setAttribute('scale', `${scale} ${scale} ${scale}`);
  }

  element.setAttribute('bounds', 'tight');
  element.setAttribute('camera-target', 'auto auto auto');

  const rect = typeof element.getBoundingClientRect === 'function' ? element.getBoundingClientRect() : null;
  const aspect =
    rect && rect.width > 0 && rect.height > 0 ? rect.width / rect.height : 4 / 3;

  const fovDeg =
    options.fovDeg ??
    parseDeg(element.getAttribute?.('field-of-view'), 30);
  element.setAttribute('field-of-view', `${fovDeg}deg`);

  const fovRad = (clamp(fovDeg, 10, 60) * Math.PI) / 180;
  const halfV = Math.tan(fovRad / 2);
  const halfH = Math.tan(fovRad / 2) * aspect;

  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  const scaledDepth = depth * scale;

  const effectiveWidth = Math.hypot(scaledWidth, scaledDepth);
  const effectiveHeight = Math.hypot(scaledHeight, scaledDepth);

  const distanceForHeight = (effectiveHeight / 2) / Math.max(halfV, 1e-6);
  const distanceForWidth = (effectiveWidth / 2) / Math.max(halfH, 1e-6);

  const paddingFactor = ensureFinite(options.paddingFactor ?? 1.18, 1.18);
  const cameraRadius = Math.max(distanceForHeight, distanceForWidth) * paddingFactor;

  const thetaDeg = ensureFinite(options.thetaDeg ?? 0, 0);
  const phiDeg = ensureFinite(options.phiDeg ?? 75, 75);
  element.setAttribute('camera-orbit', `${thetaDeg}deg ${phiDeg}deg ${cameraRadius.toFixed(3)}m`);

  const thetaRangeDeg = ensureFinite(options.thetaRangeDeg ?? 35, 35);
  const minPhiDeg = ensureFinite(options.minPhiDeg ?? 55, 55);
  const maxPhiDeg = ensureFinite(options.maxPhiDeg ?? 85, 85);
  const minRadiusFactor = ensureFinite(options.minRadiusFactor ?? 0.85, 0.85);
  const maxRadiusFactor = ensureFinite(options.maxRadiusFactor ?? 1.35, 1.35);

  element.setAttribute(
    'min-camera-orbit',
    `${-thetaRangeDeg}deg ${minPhiDeg}deg ${(cameraRadius * minRadiusFactor).toFixed(3)}m`,
  );
  element.setAttribute(
    'max-camera-orbit',
    `${thetaRangeDeg}deg ${maxPhiDeg}deg ${(cameraRadius * maxRadiusFactor).toFixed(3)}m`,
  );

  if (typeof element.jumpCameraToGoal === 'function') {
    try {
      element.jumpCameraToGoal();
    } catch {}
  }

  return { width, height, depth, maxDimension, scale, cameraRadius };
}
