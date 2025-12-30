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

const normalizeSceneInput = (body: unknown): Omit<ScenePresetAdmin, 'id'> => {
  const rec = body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  const title = typeof rec.title === 'string' ? rec.title.trim() : '';
  if (!title) {
    throw new Error('Missing required field: title');
  }
  const description = typeof rec.description === 'string' ? rec.description.trim() : '';
  const coverImageUrl = typeof rec.coverImageUrl === 'string' ? rec.coverImageUrl.trim() : '';
  const statusRaw = typeof rec.status === 'string' ? rec.status.trim() : '';
  const status =
    statusRaw === 'draft' || statusRaw === 'ready' || statusRaw === 'archived' ? statusRaw : undefined;
  const objects = normalizeTransforms(rec.objects);
  return {
    title,
    ...(description ? { description } : {}),
    objects,
    ...(coverImageUrl ? { coverImageUrl } : {}),
    ...(status ? { status } : {}),
    createdAt: typeof rec.createdAt === 'string' ? rec.createdAt : undefined,
    updatedAt: typeof rec.updatedAt === 'string' ? rec.updatedAt : undefined,
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireOwnerSession(req, res);
  if (!session) return;

  const db = getAdminDb();
  if (!db) return res.status(500).json({ error: 'Database not initialized' });

  const collection = db.collection(COLLECTIONS.scenePresets);

  if (req.method === 'GET') {
    try {
      const snap = await collection.orderBy('updatedAt', 'desc').limit(200).get();
      const scenes = snap.docs.map((doc) => toScenePresetAdmin(doc.data(), doc.id));
      return res.status(200).json({ scenes });
    } catch (error) {
      console.error('scenes GET error:', error);
      const message = error instanceof Error ? error.message : 'Failed to load scenes';
      return res.status(500).json({ error: message });
    }
  }

  if (req.method === 'POST') {
    try {
      const normalized = normalizeSceneInput(req.body);
      const now = new Date().toISOString();
      const docRef = await collection.add({
        ...normalized,
        status: normalized.status || 'draft',
        createdAt: now,
        updatedAt: now,
      });
      const created = await docRef.get();
      return res.status(201).json(toScenePresetAdmin(created.data(), docRef.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create scene';
      const status = message.startsWith('Missing required field') ? 400 : 500;
      return res.status(status).json({ error: message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}

