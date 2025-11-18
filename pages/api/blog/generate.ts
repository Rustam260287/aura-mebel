import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import type { Product, BlogPost } from '../../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const db = getAdminDb();
    if (!db) {
      return res.status(500).json({ message: 'Admin DB not initialized' });
    }

    try {
      const productsSnapshot = await db.collection('products').limit(10).get();
      const allProducts = productsSnapshot.docs.map(doc => doc.data()) as Product[];
      
      // Since geminiService is removed, we'll just return a placeholder.
      const newPost: Omit<BlogPost, 'id'> = {
        title: "New Blog Post",
        excerpt: "This is a placeholder excerpt.",
        content: "<p>This is a placeholder content.</p>",
        relatedProducts: [],
        imagePrompt: "",
        imageUrl: "/placeholder.svg",
      };

      const docRef = await db.collection('blog').add({
        ...newPost,
        date: new Date().toISOString(),
      });

      res.status(200).json({ post: { ...newPost, id: docRef.id } });
    } catch (error) {
      res.status(500).json({ message: 'Failed to generate blog post' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
