// pages/api/blog/generate.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import { generateBlogPost } from '../../../services/geminiService';
import type { Product, BlogPost } from '../../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const dbAdmin = getAdminDb();
  if (!dbAdmin) {
    return res.status(500).json({ message: 'Database connection failed' });
  }

  try {
    console.log("Fetching all products to provide context for blog post...");
    const productsSnapshot = await dbAdmin.collection('products').get();
    const allProducts = productsSnapshot.docs.map(doc => doc.data() as Product);

    console.log("Generating blog post with AI...");
    const { imageBase64, ...postData } = await generateBlogPost(allProducts);
    
    // TODO: В будущем, нужно будет загрузить imageBase64 в Firebase Storage
    // и получить публичный URL. Пока что используем data URL для простоты.
    const imageUrl = `data:image/png;base64,${imageBase64}`;
    
    const newPost: BlogPost = {
      ...postData,
      id: new Date().toISOString(), // Генерируем ID на основе времени
      imageUrl,
    };

    console.log("Saving new blog post to Firestore...");
    await dbAdmin.collection('blog').doc(newPost.id).set(newPost);

    console.log("Blog post generated and saved successfully:", newPost.id);
    res.status(200).json({ success: true, post: newPost });

  } catch (error) {
    console.error("Error generating blog post:", error);
    if (error instanceof Error) {
      res.status(500).json({ message: 'Failed to generate blog post', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to generate blog post', error: 'An unknown error occurred' });
    }
  }
}
