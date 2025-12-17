
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdmin } from '../../../lib/auth/admin-check';
import { getAdminStorage } from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- SECURITY CHECK ---
  const isAdmin = await verifyAdmin(req, res);
  if (!isAdmin) return;
  // ----------------------

  const { fileUrl } = req.body;

  if (!fileUrl || typeof fileUrl !== 'string') {
    return res.status(400).json({ error: 'fileUrl is required' });
  }

  try {
    const storage = getAdminStorage();
    const bucketName = storage.bucket().name;
    const urlPrefix = `https://storage.googleapis.com/${bucketName}/`;

    if (!fileUrl.startsWith(urlPrefix)) {
      console.warn(`Attempted to delete a file from a foreign URL: ${fileUrl}`);
      // Не пытаемся удалять файлы из чужого хранилища, но возвращаем успех
      return res.status(200).json({ message: 'File URL is not from this project\'s bucket. Skipped.' });
    }

    // Извлекаем путь к файлу из URL
    const filePath = decodeURIComponent(fileUrl.substring(urlPrefix.length).split('?')[0]);
    const file = storage.bucket().file(filePath);

    const [exists] = await file.exists();
    if (exists) {
        await file.delete();
        console.log(`Successfully deleted old file: ${filePath}`);
        res.status(200).json({ message: 'File deleted successfully' });
    } else {
        console.log(`Old file not found, skipping deletion: ${filePath}`);
        res.status(200).json({ message: 'File not found, skipping deletion' });
    }

  } catch (error: any) {
    console.error('Error deleting file from storage:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
}
