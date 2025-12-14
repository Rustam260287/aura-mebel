
import { NextApiRequest } from 'next';
import { getAdminAuth } from '../firebaseAdmin';

/**
 * Checks for a valid user token and returns the user's UID.
 * Returns null if not authenticated.
 */
export async function getUserId(req: NextApiRequest): Promise<string | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.split('Bearer ')[1];
    const auth = getAdminAuth();
    if (!auth) return null;

    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    return null;
  }
}
