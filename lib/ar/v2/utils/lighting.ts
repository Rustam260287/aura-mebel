import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Configure "Premium" AR Lighting.
 * Goal: Physically plausible but slightly enhanced lighting to prevent dark models.
 */
export const setupARLighting = (scene: THREE.Scene, renderer: THREE.WebGLRenderer) => {
    // 1. Hemisphere Light (Base Ambience)
    // intense: 1.25 (slightly higher than physical to lift shadows)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xdddddd, 1.25);
    hemiLight.position.set(0, 1, 0);
    scene.add(hemiLight);

    // 2. Directional Key Light (Main Source)
    // No shadows for performance and softness
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(3, 6, 2);
    dirLight.castShadow = false;
    scene.add(dirLight);

    // 3. Directional Fill Light (Secondary)
    // Fills dark areas from the opposite side/below
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
    fillLight.position.set(-2, 2, -3);
    fillLight.castShadow = false;
    scene.add(fillLight);

    // 4. Environment Map (Critical for PBR)
    // Use clear neutral RoomEnvironment to make metals/woods look "alive"
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    // 0.04 blur for RoomEnvironment (standard "sharp but soft" look)
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;

    // Clean up generator
    pmremGenerator.dispose();

    // 5. Tone Mapping & Color Space
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1; // > 1.0 to brighten, but < 1.2 to avoid washout
    renderer.outputColorSpace = THREE.SRGBColorSpace;
};

/**
 * Fallback Material Correction.
 * If models still look dark, boost envMapIntensity slightly.
 */
export const applyMaterialFallback = (object: THREE.Object3D) => {
    object.traverse((child) => {
        if ((child as any).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.material) {
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

                materials.forEach((mat) => {
                    if ((mat as any).isMeshStandardMaterial) {
                        const stdMat = mat as THREE.MeshStandardMaterial;
                        // Boost environment reflection slightly
                        // Do NOT change baseColor or roughness
                        stdMat.envMapIntensity = 1.2;
                        stdMat.needsUpdate = true;
                    }
                });
            }
        }
    });
};
