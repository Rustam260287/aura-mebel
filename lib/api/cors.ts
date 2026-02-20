import type { NextApiRequest, NextApiResponse } from 'next';

export function setCorsHeaders(req: NextApiRequest, res: NextApiResponse) {
    const origin = req.headers.origin;
    // In dev, allow all explicitly to support credentials
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
}
