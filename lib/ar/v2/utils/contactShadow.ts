/**
 * Contact Shadow — iOS Quick Look style
 * 
 * Creates a soft, circular gradient shadow beneath an object.
 * This is how iOS AR Quick Look "grounds" objects — it's a simple
 * textured plane, NOT real-time shadow mapping (which is expensive on mobile).
 * 
 * The shadow:
 * - Follows the object during drag gestures
 * - Scales proportionally with the object's XZ footprint
 * - Uses a radial gradient for realistic soft-edge falloff
 * - Is fully transparent in AR (blends with real-world floor)
 */

import * as THREE from 'three';

const SHADOW_RESOLUTION = 128; // Low res is fine for a blurred circle
const SHADOW_OPACITY = 0.35;   // iOS uses subtle shadows (0.3-0.4)

/**
 * Generate a radial gradient shadow texture via Canvas2D
 */
function createShadowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = SHADOW_RESOLUTION;
    canvas.height = SHADOW_RESOLUTION;
    const ctx = canvas.getContext('2d')!;

    const cx = SHADOW_RESOLUTION / 2;
    const cy = SHADOW_RESOLUTION / 2;
    const radius = SHADOW_RESOLUTION / 2;

    // Radial gradient: solid center → transparent edges
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, `rgba(0, 0, 0, ${SHADOW_OPACITY})`);
    gradient.addColorStop(0.4, `rgba(0, 0, 0, ${SHADOW_OPACITY * 0.7})`);
    gradient.addColorStop(0.7, `rgba(0, 0, 0, ${SHADOW_OPACITY * 0.3})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, SHADOW_RESOLUTION, SHADOW_RESOLUTION);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// Cache the texture (all shadows share the same gradient)
let _cachedShadowTexture: THREE.CanvasTexture | null = null;

function getShadowTexture(): THREE.CanvasTexture {
    if (!_cachedShadowTexture) {
        _cachedShadowTexture = createShadowTexture();
    }
    return _cachedShadowTexture;
}

/**
 * Create a contact shadow mesh for an object.
 * 
 * @param footprintX - Width of the object's XZ footprint (meters)
 * @param footprintZ - Depth of the object's XZ footprint (meters)
 * @returns THREE.Mesh — the shadow plane, positioned at Y=0.001
 */
export function createContactShadow(footprintX: number, footprintZ: number): THREE.Mesh {
    // Shadow is slightly larger than the footprint for a natural look
    const shadowScale = 1.3;
    const shadowWidth = footprintX * shadowScale;
    const shadowDepth = footprintZ * shadowScale;

    const geometry = new THREE.PlaneGeometry(shadowWidth, shadowDepth);
    geometry.rotateX(-Math.PI / 2); // Lay flat on ground

    const material = new THREE.MeshBasicMaterial({
        map: getShadowTexture(),
        transparent: true,
        opacity: 1, // Opacity is baked into the texture
        depthWrite: false, // Prevent z-fighting
        blending: THREE.NormalBlending,
    });

    const shadowMesh = new THREE.Mesh(geometry, material);
    shadowMesh.name = 'contactShadow';
    shadowMesh.position.y = 0.001; // Just above ground to avoid z-fighting
    shadowMesh.renderOrder = -1; // Render before other objects

    return shadowMesh;
}

/**
 * Dispose shadow resources on cleanup
 */
export function disposeShadowCache(): void {
    if (_cachedShadowTexture) {
        _cachedShadowTexture.dispose();
        _cachedShadowTexture = null;
    }
}
