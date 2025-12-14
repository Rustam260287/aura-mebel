
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { getUserId } from '../../../../lib/auth/user-check';
import { askAI } from '../../../../lib/ai/core';
import { SearchService } from '../../../../lib/services/search.service';
import { detectIntent } from '../../../../lib/ai/agents/orchestrator';
import { Product, ProjectContext, ChatMessage } from '../../../../types';
import admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const userId = await getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { projectId } = req.query;
  const { message, imageUrl } = req.body;

  if (!projectId || !message) {
    return res.status(400).json({ error: 'Project ID and message are required' });
  }

  const db = getAdminDb();
  if (!db) return res.status(500).json({ error: 'DB not available' });

  try {
    const projectRef = db.collection('projects').doc(projectId as string);
    const projectSnap = await projectRef.get();

    if (!projectSnap.exists || projectSnap.data()?.userId !== userId) {
        return res.status(404).json({ error: 'Project not found' });
    }
    
    let project = projectSnap.data() as ProjectContext;
    const intent = await detectIntent(message);

    // --- HANDLE VISUAL CHANGE INTENT ---
    if (intent === 'CHANGE_VISUAL') {
        const params: any = await askAI({
            key: 'VISUAL_PARAM_EXTRACTOR',
            variables: { message },
            responseFormat: 'json'
        });

        const actionResponse = {
            role: 'assistant',
            content: `Секунду, применяю материал "${params.material_name}"...`,
            action: { type: 'SET_MATERIAL', payload: params.material_name }
        };
        
        // Save to history and respond
        await projectRef.update({
            chatHistory: admin.firestore.FieldValue.arrayUnion({role: 'user', content: message}, actionResponse),
            updatedAt: new Date().toISOString()
        });

        return res.status(200).json(actionResponse);
    }
    
    // --- STANDARD CHAT LOGIC ---
    let products: Product[] = [];
    if (intent === 'CATALOG' || intent === 'GENERAL') {
        products = await SearchService.search({ query: message });
    }
    
    const contextVariables = {
        catalog: products.map(p => `ID: ${p.id}; ${p.name}`).join('\n'),
    };
    
    const response: any = await askAI({
        key: 'AGENT_CATALOG', // Simplified for now
        variables: contextVariables,
        context: [...project.chatHistory, { role: "user", content: message }],
        responseFormat: 'json',
        model: 'gpt-4o'
    });

    const newUserMessage = { role: 'user', content: message };
    const aiResponseMessage = { role: 'assistant', content: response.reply, products: response.recommendedProductIds };

    await projectRef.update({
        chatHistory: admin.firestore.FieldValue.arrayUnion(newUserMessage, aiResponseMessage),
        updatedAt: new Date().toISOString()
    });
    
    res.status(200).json(aiResponseMessage);

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
