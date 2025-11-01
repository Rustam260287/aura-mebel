import { GoogleGenAI, Type, Modality } from "@google/genai";
// Fix: Corrected import path for Product type
import type { Product, BlogPost } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const getStyleRecommendations = async (prompt: string, products: Product[]): Promise<string[]> => {
  if (!prompt.trim()) {
    return [];
  }

  const productNames = products.map(p => p.name).join(', ');

  const fullPrompt = `Вы — эксперт-помощник по дизайну интерьеров для магазина 'Aura Мебель'. 
Клиент хочет оформить свою комнату в следующем стиле: "${prompt}".
Вот список доступных товаров: ${productNames}.
Основываясь на пожеланиях клиента, порекомендуйте до 3 товаров, которые идеально подойдут.
Верните ответ в виде JSON-массива строк, где каждая строка — это точное 'name' рекомендованного товара из предоставленного списка.
Например: ["Название товара 1", "Название товара 2"].
Верните только JSON-массив.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const jsonText = response.text.trim();
    const recommendations = JSON.parse(jsonText);
    
    // Validate that the response is an array of strings
    if (Array.isArray(recommendations) && recommendations.every(item => typeof item === 'string')) {
      return recommendations;
    } else {
      console.error("Gemini API returned an invalid format:", recommendations);
      return [];
    }

  } catch (error) {
    console.error("Error fetching style recommendations:", error);
    throw new Error("Не удалось получить рекомендации. Пожалуйста, попробуйте еще раз.");
  }
};

export const getVisualRecommendations = async (
  base64Image: string,
  mimeType: string,
  products: Product[]
): Promise<string[]> => {
  const productInfo = products.map(p => `'${p.name}' (Категория: ${p.category})`).join('; ');

  const textPart = {
    text: `Ты — ИИ-стилист для мебельного магазина 'Aura Мебель'. Проанализируй это изображение интерьера.
    1. Определи основные предметы мебели на фото (например, диван, стол, кресло).
    2. Для каждого найденного предмета подбери наиболее похожий товар из следующего списка: ${productInfo}.
    3. Верни результат в виде JSON-массива строк, где каждая строка — это точное 'name' рекомендованного товара из списка. Порекомендуй до 3-х самых релевантных товаров.
    Пример: ["Минималистичный дубовый каркас кровати", "Кофейный столик с мраморной столешницей"].
    Верни только JSON-массив. Если на фото нет мебели или ничего не подходит, верни пустой массив.`,
  };

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType,
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
    });

    const jsonText = response.text.trim();
    const recommendations = JSON.parse(jsonText);

    if (Array.isArray(recommendations) && recommendations.every(item => typeof item === 'string')) {
      return recommendations;
    } else {
      console.error("Gemini API returned an invalid format for visual search:", recommendations);
      return [];
    }
  } catch (error) {
    console.error("Error fetching visual recommendations:", error);
    throw new Error("Не удалось обработать изображение. Пожалуйста, попробуйте другой файл.");
  }
};


export const getAiConfigurationDescription = async (
  productName: string,
  configuration: Record<string, string>
): Promise<string> => {
  const configString = Object.entries(configuration)
    .map(([optionName, choiceName]) => {
        // A simple mapping from id to a more readable name for the prompt
        const readableOptionNames: Record<string, string> = {
            'fabric': 'Обивка',
            'color': 'Цвет',
            'legs': 'Ножки'
        };
        return `- ${readableOptionNames[optionName] || optionName}: ${choiceName}`;
    })
    .join('\n');

  const fullPrompt = `Ты — креативный копирайтер и дизайнер интерьеров для мебельного магазина 'Aura Мебель'.
Клиент сконфигурировал товар "${productName}" со следующими параметрами:
${configString}

Напиши яркое, вдохновляющее и привлекательное описание для этого уникального товара (2-3 предложения). Опиши, как он будет смотреться в интерьере, какие ощущения вызовет. Сделай текст живым и эмоциональным. Верни только текст описания, без лишних фраз вроде "Вот описание:".`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error fetching AI description:", error);
    throw new Error("Не удалось сгенерировать описание. Пожалуйста, попробуйте еще раз.");
  }
};

export const generateStagedImage = async (
  product: Product,
  roomImageBase64: string,
  roomImageMimeType: string
): Promise<string> => {
  const prompt = `Это фотография комнаты пользователя. Твоя задача — реалистично вписать в эту сцену следующий предмет мебели: 
  - Название: ${product.name}
  - Описание: ${product.description}
  - Размеры: ${product.details.dimensions}

  Требования:
  1.  Размести предмет мебели в подходящем месте комнаты. Если в комнате уже есть похожий предмет (например, старый диван), замени его на новый.
  2.  Сохрани стиль, освещение, тени и перспективу оригинального изображения. 
  3.  Итоговый результат должен быть максимально фотореалистичным.
  4.  Верни только измененное изображение, без текста или других элементов.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: roomImageBase64,
              mimeType: roomImageMimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    throw new Error("API не вернуло изображение.");

  } catch (error) {
    console.error("Error generating staged image:", error);
    throw new Error("Не удалось сгенерировать изображение. Попробуйте еще раз.");
  }
};

export const changeProductUpholstery = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  const fullPrompt = `Твоя задача — изменить обивку мебели на этом изображении. 
Новая обивка должна быть: "${prompt}".
Важно: сохрани фон, форму мебели, тени и освещение без изменений. Измени только текстуру и цвет обивки.
Верни только готовое изображение без какого-либо текста.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          { text: fullPrompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    throw new Error("API не вернуло изображение.");

  } catch (error) {
    console.error("Error changing upholstery image:", error);
    throw new Error("Не удалось изменить обивку. Попробуйте другой запрос.");
  }
};

export const generateSeoProductDescription = async (product: Product): Promise<string> => {
  const prompt = `Ты — профессиональный SEO-копирайтер для мебельного магазина "Aura Мебель". Твоя задача — написать уникальное и привлекательное SEO-описание для товара.

**Данные о товаре:**
- Название: ${product.name}
- Категория: ${product.category}
- Базовое описание: ${product.description}
- Материал: ${product.details.material}
- Размеры: ${product.details.dimensions}

**Требования к тексту:**
1.  **Объем:** 800-1200 символов.
2.  **Стиль:** Вдохновляющий, но информативный. Подчеркни натуральность материалов, качество и преимущества дизайна.
3.  **SEO-ключи:** Органично впиши в текст ключевые слова, релевантные товару. Например: "купить ${product.name.toLowerCase()}", "мебель для ${product.category.toLowerCase()} Альметьевск", "кровать из массива", "дизайнерская мебель". Используй синонимы и связанные понятия.
4.  **Структура:** Начни с привлекающего внимание абзаца, затем опиши детали и преимущества, и закончи призывом к действию.
5.  **Уникальность:** Текст должен быть на 100% уникальным.
6.  **Выходной формат:** Только готовый текст, без заголовков вроде "Вот описание:".`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating SEO description:", error);
    throw new Error("Не удалось сгенерировать SEO-описание.");
  }
};

export const generateSeoCategoryDescription = async (categoryName: string, products: Product[]): Promise<string> => {
  const productExamples = products.slice(0, 5).map(p => p.name).join(', ');

  const prompt = `Ты — профессиональный SEO-копирайтер для мебельного магазина "Aura Мебель". Твоя задача — написать уникальное и привлекательное SEO-описание для страницы категории товаров.

**Данные о категории:**
- Название категории: ${categoryName}
- Примеры товаров в категории: ${productExamples}

**Требования к тексту:**
1.  **Объем:** 500-800 символов.
2.  **Стиль:** Вдохновляющий и гостеприимный. Расскажи, какую атмосферу можно создать с помощью мебели из этой категории.
3.  **SEO-ключи:** Органично впиши в текст ключевые слова: "купить мебель для ${categoryName.toLowerCase()} в Альметьевске", "мебель для ${categoryName.toLowerCase()} недорого", "стильная мебель для ${categoryName.toLowerCase()}". Упомяни название магазина "Aura Мебель".
4.  **Содержание:** Кратко опиши стиль представленной мебели. Можно упомянуть 1-2 примера товаров, чтобы сделать текст более живым.
5.  **Уникальность:** Текст должен быть на 100% уникальным.
6.  **Выходной формат:** Только готовый текст, без заголовков вроде "Вот описание:".`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating SEO category description:", error);
    throw new Error("Не удалось сгенерировать описание для категории.");
  }
};

export const generateBlogPost = async (products: Product[]): Promise<Omit<BlogPost, 'id' | 'imageUrl'>> => {
      const productExamples = products.map(p => ({ name: p.name, description: p.description })).slice(0, 10);

      const prompt = `Ты — эксперт по дизайну интерьеров и контент-маркетолог для мебельного магазина "Aura Мебель". Твоя задача — написать интересную и полезную статью для блога.

      **Требования:**
      1.  **Придумай тему:** Выбери привлекательную тему, связанную с мебелью, декором или созданием уюта в доме (например, "5 шагов к идеальной гостиной", "Как выбрать диван: гид для новичков", "Тренды в дизайне спальни 2024").
      2.  **Напиши статью:**
          *   **Заголовок (title):** Яркий и цепляющий.
          *   **Содержание (content):** Текст статьи объемом 1500-2000 символов. Структурируй текст: введение, несколько абзацев по теме, заключение. Для форматирования используй перенос строки (\n) для разделения абзацев.
          *   **Интеграция товаров:** В процессе написания, органично и ненавязчиво упомяни 1 или 2 товара из списка ниже. Упоминай только их точные названия.
          *   **Краткий анонс (excerpt):** Короткое описание статьи (2-3 предложения) для превью в списке блога.
      3.  **Придумай промпт для изображения (imagePrompt):** Создай краткий, но детальный промпт на английском языке для AI-генератора изображений (например, DALL-E или Midjourney), который бы создал красивую тематическую иллюстрацию для статьи. Промпт должен быть в стиле "photorealistic interior design, scandinavian living room with a cozy gray sofa, warm blankets, large window with natural light, minimalist decor, calm and serene atmosphere".
      4.  **Верни результат** в виде JSON-объекта.

      **Список доступных товаров для упоминания:**
      ${JSON.stringify(productExamples)}

      **Требуемый формат ответа (строго JSON):**
      {
        "title": "Заголовок статьи",
        "excerpt": "Краткий анонс статьи...",
        "content": "Полный текст статьи с абзацами...",
        "relatedProducts": ["Название упомянутого товара 1", "Название упомянутого товара 2"],
        "imagePrompt": "Промпт для генерации изображения на английском"
      }`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                excerpt: { type: Type.STRING },
                content: { type: Type.STRING },
                relatedProducts: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                imagePrompt: { type: Type.STRING }
              },
              required: ["title", "excerpt", "content", "relatedProducts", "imagePrompt"],
            }
          }
        });

        const jsonResult = JSON.parse(response.text.trim());
        
        const relatedProductIds = jsonResult.relatedProducts
            .map((name: string) => products.find(p => p.name === name)?.id)
            .filter((id: number | undefined): id is number => id !== undefined);

        return {
          title: jsonResult.title,
          excerpt: jsonResult.excerpt,
          content: jsonResult.content.replace(/\n/g, '<br /><br />'),
          relatedProducts: relatedProductIds,
          imagePrompt: jsonResult.imagePrompt,
        };
      } catch (error) {
        console.error("Error generating blog post:", error);
        throw new Error("Не удалось сгенерировать статью для блога.");
      }
    };