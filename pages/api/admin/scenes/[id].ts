import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { requireOwnerSession } from '../../../../lib/auth/admin-session';
import { COLLECTIONS } from '../../../../lib/db/collections';
import type { SceneObjectTransform, ScenePresetAdmin } from '../../../../types';
import { toScenePresetAdmin } from '../../../../lib/scenePreset';

const asNumber = (value: unknown, fallback: number): number => {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
};

const asTuple3 = (value: unknown, fallback: [number, number, number]): [number, number, number] => {
  if (!Array.isArray(value) || value.length < 3) return fallback;
  return [asNumber(value[0], fallback[0]), asNumber(value[1], fallback[1]), asNumber(value[2], fallback[2])];
};

const normalizeTransforms = (value: unknown): SceneObjectTransform[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry): SceneObjectTransform | null => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
      const rec = entry as Record<string, unknown>;
      const objectId = typeof rec.objectId === 'string' ? rec.objectId.trim() : '';
      if (!objectId) return null;
      const position = asTuple3(rec.position, [0, 0, 0]);
      const rotation = asTuple3(rec.rotation, [0, 0, 0]);
      const scaleRaw = asNumber(rec.scale, 1);
      const scale = Number.isFinite(scaleRaw) && scaleRaw > 0 ? scaleRaw : 1;
      return { objectId, position, rotation, scale };
    })
    .filter((v): v is SceneObjectTransform => Boolean(v));
};

const normalizeScenePatch = (body: unknown): Partial<Omit<ScenePresetAdmin, 'id'>> => {
  const rec = body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  const patch: Partial<Omit<ScenePresetAdmin, 'id'>> = {};

  if (typeof rec.title === 'string') {
    const title = rec.title.trim();
    if (!title) throw new Error('title cannot be empty');
    patch.title = title;
  }
  if (typeof rec.description === 'string') {
    const description = rec.description.trim();
    patch.description = description ? description : undefined;
  }
  if (typeof rec.coverImageUrl === 'string') {
    const coverImageUrl = rec.coverImageUrl.trim();
    patch.coverImageUrl = coverImageUrl ? coverImageUrl : undefined;
  }
  if (typeof rec.status === 'string') {
    const statusRaw = rec.status.trim();
    if (statusRaw === 'draft' || statusRaw === 'ready' || statusRaw === 'archived') {
      patch.status = statusRaw;
    }
  }
  if (rec.objects !== undefined) {
    patch.objects = normalizeTransforms(rec.objects);
  }
  return patch;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireOwnerSession(req, res);
  if (!session) return;

  const id = typeof req.query.id === 'string' ? req.query.id.trim() : '';
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const db = getAdminDb();
  if (!db) return res.status(500).json({ error: 'Database not initialized' });

  const docRef = db.collection(COLLECTIONS.scenePresets).doc(id);

  if (req.method === 'GET') {
    try {
      const snap = await docRef.get();
      if (!snap.exists) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(toScenePresetAdmin(snap.data(), snap.id));
    } catch (error) {
      console.error('scene GET error:', error);
      const message = error instanceof Error ? error.message : 'Failed to load scene';
      return res.status(500).json({ error: message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const patch = normalizeScenePatch(req.body);
      patch.updatedAt = new Date().toISOString();
      await docRef.set(patch, { merge: true });
      const snap = await docRef.get();
      return res.status(200).json(toScenePresetAdmin(snap.data(), snap.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update scene';
      const status = message.includes('cannot be empty') ? 400 : 500;
      return res.status(status).json({ error: message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await docRef.delete();
      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error('scene DELETE error:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete scene';
      return res.status(500).json({ error: message });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ error: 'Method not allowed' });
}

