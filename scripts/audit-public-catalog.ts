import { COLLECTIONS } from '../lib/db/collections';
import { listPublicCollectionDocuments } from '../lib/firestore/publicFetch';
import { toPublicObject } from '../lib/publicObject';
import { toScenePresetPublic } from '../lib/scenePreset';
import { isProductionReadyObject, isProductionReadyScene } from '../lib/catalog/publicReadiness';

async function main() {
  const objectDocs = await listPublicCollectionDocuments(COLLECTIONS.objects);
  const allObjects = objectDocs.map((doc) => toPublicObject(doc, String(doc.id || '')));
  const readyObjects = allObjects.filter((object) => isProductionReadyObject(object));
  const objectMap = new Map(readyObjects.map((object) => [object.id, object] as const));

  let allScenes = [] as ReturnType<typeof toScenePresetPublic>[];
  let readyScenes = [] as ReturnType<typeof toScenePresetPublic>[];
  let sceneAuditError: string | null = null;

  try {
    const sceneDocs = await listPublicCollectionDocuments(COLLECTIONS.scenePresets);
    allScenes = sceneDocs.map((doc) => toScenePresetPublic(doc, String(doc.id || '')));
    readyScenes = allScenes.filter((scene) => isProductionReadyScene(scene, objectMap));
  } catch (error) {
    sceneAuditError = error instanceof Error ? error.message : String(error);
  }

  const missingImage = allObjects.filter((object) => object.status === 'ready' && !object.imageUrls?.length);
  const missing3D = allObjects.filter(
    (object) => object.status === 'ready' && !object.has3D && !object.modelGlbUrl && !object.modelUsdzUrl,
  );

  console.log('[audit-public-catalog] Objects');
  console.log(`- total: ${allObjects.length}`);
  console.log(`- production-ready: ${readyObjects.length}`);
  console.log(`- ready but no images: ${missingImage.length}`);
  console.log(`- ready but no 3D: ${missing3D.length}`);

  console.log('[audit-public-catalog] Scenes');
  if (sceneAuditError) {
    console.log(`- unavailable: ${sceneAuditError}`);
  } else {
    console.log(`- total public scenes: ${allScenes.length}`);
    console.log(`- production-ready scenes: ${readyScenes.length}`);
  }

  if (readyObjects.length === 0) {
    console.error('[audit-public-catalog] No production-ready objects found');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('[audit-public-catalog] Failed:', error);
  process.exit(1);
});
