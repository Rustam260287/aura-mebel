import { COLLECTIONS } from '../db/collections';
import { listPublicCollectionDocuments } from '../firestore/publicFetch';
import { toPublicObject } from '../publicObject';
import { isProductionReadyObject } from './publicReadiness';
import type { Mood as WizardMood, ObjectType, Presence } from '../antigravity/types';
import type { RedesignInput } from '../redesign/types';

type MatchableDoc = Record<string, unknown> & { id: string };

type MatchableObject = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  modelGlbUrl?: string;
  modelUsdzUrl?: string;
  has3D: boolean;
  tokens: string;
  mood?: string;
  presence?: string;
};

type ScoredObject = {
  object: MatchableObject;
  score: number;
  typeMatched: boolean;
};

type MatchRequest = {
  objectType: ObjectType | RedesignInput['object_type'];
  mood?: WizardMood | RedesignInput['mood'];
  style?: RedesignInput['style'];
  presence?: Presence;
};

const TYPE_KEYWORDS: Record<MatchRequest['objectType'], string[]> = {
  sofa: ['диван', 'sofa', 'couch', 'sectional', 'мягк'],
  armchair: ['кресл', 'armchair', 'recliner', 'lounge'],
  bed: ['кровать', 'bed', 'спальн'],
  table: ['стол', 'table', 'desk', 'обеден', 'журналь', 'консоль'],
  chair: ['стул', 'chair', 'барный', 'сиденье'],
  shelf: ['стеллаж', 'shelf', 'storage', 'витрина', 'комод', 'шкаф'],
};

const STYLE_KEYWORDS: Record<NonNullable<MatchRequest['style']>, string[]> = {
  minimal: ['minimal', 'миним', 'clean', 'scandi', 'соврем'],
  cozy: ['cozy', 'уют', 'warm', 'soft', 'homey', 'тёпл'],
  modern: ['modern', 'соврем', 'contemporary', 'clean'],
  classic: ['classic', 'класс', 'timeless', 'traditional'],
};

const MOOD_KEYWORDS: Record<NonNullable<MatchRequest['mood']>, string[]> = {
  calm: ['calm', 'спокой', 'soft', 'мягк'],
  soft: ['soft', 'мягк', 'calm'],
  expressive: ['expressive', 'выраз', 'accent', 'dramatic'],
  strict: ['strict', 'строг', 'clean', 'minimal'],
  warm: ['warm', 'тёпл', 'cozy', 'уют'],
  fresh: ['fresh', 'свеж', 'clean', 'light'],
  dramatic: ['dramatic', 'выраз', 'accent', 'contrast'],
};

const PRESENCE_KEYWORDS: Record<NonNullable<MatchRequest['presence']>, string[]> = {
  compact: ['compact', 'small', 'компакт', 'light'],
  balanced: ['balanced', 'standard', 'neutral', 'стандарт'],
  dominant: ['dominant', 'large', 'grand', 'простор', 'big'],
};

const normalize = (value: unknown) =>
  String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();

const collectTokens = (doc: MatchableDoc) => {
  const listFields = ['tags', 'styleTags', 'materialTags', 'colorTags', 'formTags'];
  const listValues = listFields.flatMap((field) => (Array.isArray(doc[field]) ? (doc[field] as unknown[]) : []));

  return normalize(
    [
      doc.name,
      doc.title,
      doc.description,
      doc.objectType,
      doc.category,
      doc.roomType,
      doc.style,
      doc.mood,
      ...listValues,
    ].join(' '),
  );
};

const optionalStringProp = (key: string, value: string | undefined) => (value ? { [key]: value } : {});

const buildMatchableObjects = async (): Promise<MatchableObject[]> => {
  const docs = await listPublicCollectionDocuments(COLLECTIONS.objects);

  return docs
    .map((doc) => {
      const publicObject = toPublicObject(doc, String(doc.id || ''));
      if (!isProductionReadyObject(publicObject)) return null;

      const rawDoc = doc as MatchableDoc;
      return {
        id: publicObject.id,
        name: publicObject.name,
        ...optionalStringProp('description', publicObject.description),
        ...optionalStringProp('imageUrl', publicObject.imageUrls[0]),
        ...optionalStringProp('modelGlbUrl', publicObject.modelGlbUrl),
        ...optionalStringProp('modelUsdzUrl', publicObject.modelUsdzUrl),
        has3D: Boolean(publicObject.has3D),
        tokens: collectTokens(rawDoc),
        ...optionalStringProp('mood', normalize(rawDoc.mood)),
        ...optionalStringProp('presence', normalize(rawDoc.presence)),
      };
    })
    .filter((value): value is MatchableObject => value !== null);
};

const includesAny = (haystack: string, needles: string[]) => needles.some((needle) => haystack.includes(needle));

const hasTypeMatch = (object: MatchableObject, objectType: MatchRequest['objectType']) =>
  includesAny(object.tokens, TYPE_KEYWORDS[objectType] || []);

const scoreObject = (object: MatchableObject, request: MatchRequest): ScoredObject => {
  let score = 0;
  const typeMatched = hasTypeMatch(object, request.objectType);

  if (typeMatched) score += 24;
  if (object.has3D) score += 8;
  if (object.imageUrl) score += 4;

  if (request.style && includesAny(object.tokens, STYLE_KEYWORDS[request.style] || [])) score += 7;
  if (request.mood) {
    const moodKeywords = MOOD_KEYWORDS[request.mood] || [];
    if (object.mood && moodKeywords.includes(object.mood)) score += 8;
    else if (includesAny(object.tokens, moodKeywords)) score += 5;
  }

  if (request.presence) {
    const presenceKeywords = PRESENCE_KEYWORDS[request.presence] || [];
    if (object.presence && presenceKeywords.includes(object.presence)) score += 6;
    else if (includesAny(object.tokens, presenceKeywords)) score += 3;
  }

  return { object, score, typeMatched };
};

export const selectCatalogObject = async (request: MatchRequest) => {
  const objects = await buildMatchableObjects();
  if (objects.length === 0) return null;

  const scored = objects
    .map((object) => scoreObject(object, request))
    .sort((a, b) => b.score - a.score);

  const typedCandidates = scored.filter((entry) => entry.typeMatched);
  const best = (typedCandidates.length > 0 ? typedCandidates : scored)[0];
  if (!best || best.score <= 0) {
    return objects[0];
  }

  return best.object;
};
