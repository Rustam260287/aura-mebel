import { ActionPlan, AgentMessage, SessionState } from '../types';
import { VisionAgent } from './vision';
import { CatalogAgent } from './catalog';
import { GuardianAgent } from './guardian';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export class SupervisorAgent {
    static async process(
        input: { text: string; imageBase64?: string },
        state: SessionState
    ): Promise<AgentMessage> {
        // 1. Intent Detection via LLM
        const intent = await this.detectIntent(input.text, !!input.imageBase64);
        console.log(`[Supervisor] Intent detected: ${intent}`);

        let response: AgentMessage = {
            role: 'assistant',
            content: 'I am not sure how to help with that.',
        };

        try {
            // 2. Routing
            if (intent === 'analyze_room' && input.imageBase64) {
                const analysis = await VisionAgent.analyze(input.imageBase64);
                state.context.roomAnalysis = analysis;

                // Richer response based on "Inspire" goal
                const mood = analysis.mood || 'Спокойная атмосфера';
                const style = analysis.style || 'современный';
                const recs = analysis.recommendations?.join(', ') || 'мебель натуральных оттенков';

                response = {
                    role: 'assistant',
                    content: `Это пространство ощущается как ${mood}. Стиль ближе к ${style}. \n\n${analysis.reasoning || ''}\n\nЯ бы предложил добавить: ${recs}, чтобы усилить это впечатление.`,
                    metadata: { type: 'analysis', data: analysis },
                    ui: {
                        id: 'AnalysisResult',
                        props: {
                            imageUrl: input.imageBase64,
                            analysis: analysis
                        }
                    },
                    suggestions: ['Покажи варианты', 'Смени стиль', 'Добавь декор']
                };
            }
            else if (intent === 'search_products') {
                // Pass Vision Context + User Text to Curator
                const currentStyle = state.context.roomAnalysis?.style;
                const currentMood = state.context.roomAnalysis?.mood;
                const contextStr = currentStyle ? `Room Style: ${currentStyle}, Mood: ${currentMood}` : '';

                const results = await CatalogAgent.search({
                    userQuery: input.text, // "I want a cozy sofa"
                    style: currentStyle ? `${currentStyle} ${currentMood || ''}` : undefined,
                    previousItems: state.context.lastShownProducts,
                    contextStr: contextStr
                });

                if (results.length > 0) {
                    // Save context for next turn
                    state.context.lastShownProducts = results;

                    // For MVP, we construct a simple message. 
                    // Ideally, CatalogAgent returns an "intro" string too, but we can synthesize one or take first item's reason.
                    const intro = results[0].aiReasoning ? "Подобрал для вас несколько вариантов с нужным настроением:" : "Вот что я нашел:";

                    response = {
                        role: 'assistant',
                        content: intro,
                        metadata: { type: 'products', data: results },
                        ui: {
                            id: 'ProductCarousel',
                            props: {
                                products: results
                            }
                        },
                        suggestions: ['Темнее', 'Светлее', 'Другой цвет', 'Друрая форма']
                    };
                } else {
                    response = {
                        role: 'assistant',
                        content: 'Пока не нашел ничего подходящего под новые критерии. Попробуем что-то другое?',
                        suggestions: ['Сбросить фильтры', 'Показать все']
                    };
                }
            }
            else if (intent === 'contact_manager') {
                response = {
                    role: 'assistant',
                    content: 'Я могу соединить вас с менеджером для детальной консультации. Выберите удобный способ связи:',
                    suggestions: ['WhatsApp', 'Telegram', 'Позвонить'],
                    metadata: { type: 'handoff_offer' }
                };
            }
            else {
                // General Chat
                const chatResult = await model.generateContent(`
                    You are a helpful furniture assistant named Aura. 
                    Be concise, warm, and professional. 
                    User said: "${input.text}"
                    Respond in Russian.
                `);
                response = {
                    role: 'assistant',
                    content: chatResult.response.text(),
                    suggestions: ['Подобрать мебель', 'Загрузить фото интерьера']
                };
            }
        } catch (error) {
            console.error('[Supervisor] Error:', error);
            response = {
                role: 'assistant',
                content: 'Извините, произошла ошибка при обработке вашего запроса. Попробуйте еще раз.'
            };
        }

        // 3. Guardian Check (Output)
        const safety = GuardianAgent.validateContent(response.content);
        if (!safety.safe && safety.corrected) {
            response.content = safety.corrected;
        }

        return response;
    }

    private static async detectIntent(text: string, hasImage: boolean): Promise<string> {
        if (hasImage) return 'analyze_room';

        try {
            const result = await model.generateContent(`
                Classify the user intent into one of: ['search_products', 'chat', 'contact_manager'].
                
                "I want a sofa" -> search_products
                "Show me tables" -> search_products
                "Price of this?" -> search_products
                "Darker" -> search_products
                "Different color" -> search_products
                "Cheaper" -> search_products
                "Not this style" -> search_products
                
                "Hello" -> chat
                "How are you" -> chat
                "What is your name" -> chat

                "Connect me with manager" -> contact_manager
                "Live agent" -> contact_manager
                "Call me" -> contact_manager
                "Help" -> contact_manager
                
                User input: "${text}"
                
                Return ONLY the label.
            `);
            const label = result.response.text().trim().toLowerCase();
            if (label.includes('search')) return 'search_products';
            if (label.includes('manager') || label.includes('contact')) return 'contact_manager';
            return 'chat';
        } catch (e) {
            console.warn('[Supervisor] Intent detection failed, defaulting to chat', e);
            return 'chat';
        }
    }
}
