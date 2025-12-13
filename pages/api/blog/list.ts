import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import type { BlogPost } from '../../../types';

type BlogSummary = Pick<
  BlogPost,
  'id' | 'title' | 'excerpt' | 'imageUrl' | 'createdAt' | 'tags' | 'status' | 'author'
>;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ posts: BlogSummary[] } | { error: string }>
) {
  const db = getAdminDb();
  if (!db) {
    return res.status(500).json({ error: 'Firebase Admin not initialized' });
  }

  try {
    const snapshot = await db
      .collection('blog')
      .select('title', 'excerpt', 'imageUrl', 'createdAt', 'tags', 'status', 'author')
      .get();

    const posts = snapshot.docs
      .map(doc => ({
        id: doc.id,
        title: doc.get('title') ?? '',
        excerpt: doc.get('excerpt') ?? '',
        imageUrl: doc.get('imageUrl') ?? '',
        createdAt: doc.get('createdAt') ?? '',
        tags: doc.get('tags') ?? [],
        status: doc.get('status') ?? 'draft',
        author: doc.get('author') ?? undefined,
      }))
      .filter(post => post.status === 'published' || !post.status)
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.id).getTime();
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.id).getTime();
        return timeB - timeA;
      }) as BlogSummary[];

    res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60');
    return res.status(200).json({ posts });
  } catch (error) {
    console.error('Failed to load blog summaries', error);
    return res.status(500).json({ error: 'Failed to load blog list' });
  }
}
