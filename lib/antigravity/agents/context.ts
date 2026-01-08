import { GoogleGenerativeAI } from '@google/generative-ai';
import type { RoomContext, RoomAnalysis, FurnitureZone, ObjectType } from '../types';

/**
 * ContextAgent: Анализирует контекст комнаты по фото или описанию.
 * 
 * Ответственность:
 * - Определение типа комнаты
 * - Анализ освещения и цветовой палитры
 * - Выявление зон для размещения мебели
 * - Подсказки по стилю интерьера
 * 
 * Принципы:
 * 1. Один агент = одна ответственность (Single Responsibility)
 * 2. Чистые функции без побочных эффектов
 * 3. Типизированные входы/выходы
 * 4. Confidence score для оценки уверенности
 */
export class ContextAgent {

    /**
     * Основной метод анализа контекста комнаты
     * 
     * @param input - Контекст комнаты (фото или описание)
     * @returns Результат анализа комнаты
     */
    static async analyze(input: RoomContext): Promise<RoomAnalysis> {
        try {
            // Если есть изображение - анализируем через Vision API
            if (input.imageUrl || input.imageBase64) {
                return await this.analyzeFromImage(input);
            }

            // Если только описание - анализируем текст
            if (input.userDescription) {
                return this.analyzeFromDescription(input.userDescription);
            }
        } catch (error) {
            console.error('[ContextAgent] Analysis failed:', error);
            // Fallback при ошибке
        }

        // Fallback - возвращаем дефолтный анализ
        return this.getDefaultAnalysis();
    }

    /**
     * Анализ комнаты по изображению с использованием Gemini Vision API
     */
    private static async analyzeFromImage(input: RoomContext): Promise<RoomAnalysis> {
        const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (!apiKey) {
            console.warn('[ContextAgent] API Key missing, using fallback');
            return this.getDefaultAnalysis();
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Подготовка изображения
        let imageData: { inlineData: { data: string, mimeType: string } } | undefined;

        if (input.imageBase64) {
            // Удаляем header base64 если есть (data:image/jpeg;base64,...)
            const base64Clean = input.imageBase64.split(',')[1] || input.imageBase64;
            imageData = {
                inlineData: {
                    data: base64Clean,
                    mimeType: 'image/jpeg'
                }
            };
        }
        // Note: imageUrl fetching would require fetching the buffer first, avoiding for simplicity now
        // Assuming imageBase64 is primarily used in this flow.

        if (!imageData) {
            console.warn('[ContextAgent] No valid image data');
            return this.getDefaultAnalysis();
        }

        const prompt = `
            Проанализируй это изображение интерьера и верни JSON объект со следующей структурой.
            ВАЖНО: Значения полей (кроме style_hints) должны быть строго на английском из списка.
            Массив style_hints должен содержать подсказки по стилю на РУССКОМ языке.

            Структура JSON:
            {
                "room_type": "living_room" | "bedroom" | "kitchen" | "office" | "dining" | "unknown",
                "lighting": "natural" | "artificial" | "mixed" | "dim",
                "color_temperature": "warm" | "neutral" | "cool",
                "dominant_colors": ["#hex1", "#hex2", "#hex3"],
                "estimated_area": "small" | "medium" | "large",
                "style_hints": ["стиль1", "стиль2"], 
                "furniture_zones": [
                    { 
                        "position": "center" | "left" | "right" | "corner" | "wall",
                        "suitableFor": ["sofa" | "armchair" | "bed" | "table" | "chair" | "shelf"],
                        "priority": 1-10
                    }
                ],
                "confidence": 0.1-1.0
            }
            Верни ТОЛЬКО валидный JSON без markdown форматирования.
        `;

        const result = await model.generateContent([prompt, imageData]);
        const responseText = result.response.text();

        // Очистка от markdown (```json ... ```)
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const parsed = JSON.parse(cleanJson) as RoomAnalysis;
            // Простейшая валидация полей (можно усилить zod)
            if (!parsed.room_type) throw new Error("Invalid response structure");
            return parsed;
        } catch (e) {
            console.error('[ContextAgent] Failed to parse API response', e);
            return this.getDefaultAnalysis();
        }
    }

    /**
     * Анализ комнаты по текстовому описанию
     */
    private static analyzeFromDescription(description: string): RoomAnalysis {
        const lowerDesc = description.toLowerCase();

        // Определяем тип комнаты по ключевым словам
        const roomType = this.detectRoomType(lowerDesc);

        // Определяем освещение
        const lighting = this.detectLighting(lowerDesc);

        // Определяем цветовую температуру
        const colorTemp = this.detectColorTemperature(lowerDesc);

        return {
            room_type: roomType,
            lighting: lighting,
            color_temperature: colorTemp,
            dominant_colors: this.getDefaultColorsForRoom(roomType),
            estimated_area: 'medium',
            style_hints: this.extractStyleHints(lowerDesc),
            furniture_zones: this.detectFurnitureZones(roomType),
            confidence: 0.7, // Меньше уверенности для текстового анализа
        };
    }

    /**
     * Определение типа комнаты по описанию
     */
    private static detectRoomType(description: string): RoomAnalysis['room_type'] {
        const roomKeywords: Record<RoomAnalysis['room_type'], string[]> = {
            living_room: ['гостиная', 'зал', 'living', 'гостинная'],
            bedroom: ['спальня', 'bedroom', 'кровать'],
            kitchen: ['кухня', 'kitchen', 'готовить'],
            office: ['офис', 'кабинет', 'office', 'работа'],
            dining: ['столовая', 'dining', 'обеденная'],
            unknown: [],
        };

        for (const [roomType, keywords] of Object.entries(roomKeywords)) {
            if (keywords.some(keyword => description.includes(keyword))) {
                return roomType as RoomAnalysis['room_type'];
            }
        }

        return 'unknown';
    }

    /**
     * Определение условий освещения
     */
    private static detectLighting(description: string): RoomAnalysis['lighting'] {
        if (description.includes('окно') || description.includes('солнц') || description.includes('светл')) {
            return 'natural';
        }
        if (description.includes('лампа') || description.includes('люстра') || description.includes('светильник')) {
            return 'artificial';
        }
        if (description.includes('тёмн') || description.includes('темн')) {
            return 'dim';
        }
        return 'mixed';
    }

    /**
     * Определение цветовой температуры
     */
    private static detectColorTemperature(description: string): RoomAnalysis['color_temperature'] {
        const warmKeywords = ['тёплый', 'теплый', 'уютный', 'бежевый', 'коричневый', 'оранжевый'];
        const coolKeywords = ['холодный', 'синий', 'серый', 'белый', 'минимализм'];

        if (warmKeywords.some(kw => description.includes(kw))) return 'warm';
        if (coolKeywords.some(kw => description.includes(kw))) return 'cool';
        return 'neutral';
    }

    /**
     * Извлечение подсказок по стилю
     */
    private static extractStyleHints(description: string): string[] {
        const styleKeywords: Record<string, string[]> = {
            'современный': ['современ', 'модерн', 'modern'],
            'классический': ['классик', 'classic', 'традицион'],
            'минимализм': ['минимал', 'minimal', 'простой'],
            'скандинавский': ['сканди', 'nordic', 'икеа'],
            'лофт': ['лофт', 'loft', 'индустриальн'],
        };

        const hints: string[] = [];
        for (const [style, keywords] of Object.entries(styleKeywords)) {
            if (keywords.some(kw => description.includes(kw))) {
                hints.push(style);
            }
        }

        return hints.length > 0 ? hints : ['нейтральный'];
    }

    /**
     * Определение зон для мебели на основе типа комнаты
     */
    private static detectFurnitureZones(roomType: RoomAnalysis['room_type']): FurnitureZone[] {
        const zonesByRoom: Record<RoomAnalysis['room_type'], FurnitureZone[]> = {
            living_room: [
                { position: 'center', suitableFor: ['sofa', 'table'], priority: 10 },
                { position: 'corner', suitableFor: ['armchair', 'shelf'], priority: 7 },
                { position: 'wall', suitableFor: ['shelf'], priority: 5 },
            ],
            bedroom: [
                { position: 'center', suitableFor: ['bed'], priority: 10 },
                { position: 'corner', suitableFor: ['armchair', 'shelf'], priority: 6 },
                { position: 'wall', suitableFor: ['shelf'], priority: 5 },
            ],
            kitchen: [
                { position: 'center', suitableFor: ['table', 'chair'], priority: 10 },
                { position: 'wall', suitableFor: ['shelf'], priority: 7 },
            ],
            office: [
                { position: 'center', suitableFor: ['table', 'chair'], priority: 10 },
                { position: 'corner', suitableFor: ['shelf'], priority: 8 },
            ],
            dining: [
                { position: 'center', suitableFor: ['table', 'chair'], priority: 10 },
                { position: 'wall', suitableFor: ['shelf'], priority: 5 },
            ],
            unknown: [
                { position: 'center', suitableFor: ['sofa', 'table', 'armchair'], priority: 8 },
                { position: 'wall', suitableFor: ['shelf'], priority: 5 },
            ],
        };

        return zonesByRoom[roomType] || zonesByRoom.unknown;
    }

    /**
     * Дефолтные цвета для типа комнаты
     */
    private static getDefaultColorsForRoom(roomType: RoomAnalysis['room_type']): string[] {
        const colorsByRoom: Record<string, string[]> = {
            living_room: ['#F5F5DC', '#8B4513', '#DEB887'],
            bedroom: ['#E6E6FA', '#D8BFD8', '#DDA0DD'],
            kitchen: ['#FFFAF0', '#FFF8DC', '#FAEBD7'],
            office: ['#F5F5F5', '#D3D3D3', '#A9A9A9'],
            dining: ['#FFF5EE', '#FFE4C4', '#FFDAB9'],
            unknown: ['#FFFFFF', '#F5F5F5', '#E0E0E0'],
        };

        return colorsByRoom[roomType] || colorsByRoom.unknown;
    }

    /**
     * Дефолтный анализ при отсутствии данных
     */
    private static getDefaultAnalysis(): RoomAnalysis {
        return {
            room_type: 'unknown',
            lighting: 'mixed',
            color_temperature: 'neutral',
            dominant_colors: ['#FFFFFF', '#F5F5F5', '#E0E0E0'],
            estimated_area: 'medium',
            style_hints: ['нейтральный'],
            furniture_zones: [
                { position: 'center', suitableFor: ['sofa', 'table'], priority: 8 },
            ],
            confidence: 0.3,
        };
    }
}
