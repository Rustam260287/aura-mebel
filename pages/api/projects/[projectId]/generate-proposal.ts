
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { getUserId } from '../../../../lib/auth/user-check';
import { ProjectContext } from '../../../../types';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProposalTemplate } from '../../../../components/proposals/ProposalTemplate';
import puppeteer from 'puppeteer';
import { MediaService } from '../../../../lib/media/service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const userId = await getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { projectId } = req.query;
  const db = getAdminDb();
  if (!db) return res.status(500).json({ error: 'DB not available' });

  try {
    const projectSnap = await db.collection('projects').doc(projectId as string).get();
    if (!projectSnap.exists || projectSnap.data()?.userId !== userId) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const project = { id: projectSnap.id, ...projectSnap.data() } as ProjectContext;

    // 1. Render React component to HTML string
    const html = renderToStaticMarkup(<ProposalTemplate project={project} />);

    // 2. Launch Puppeteer to "print" to PDF
    // Note: In Vercel, this might need specific args `['--no-sandbox']`
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    // 3. Upload PDF to Firebase Storage using MediaService
    const pdfUrl = await MediaService.uploadBuffer(pdfBuffer, `proposals/${projectId}`, 'application/pdf');

    res.status(200).json({ url: pdfUrl });

  } catch (error: any) {
    console.error("PDF Generation Error:", error);
    res.status(500).json({ error: error.message });
  }
}
