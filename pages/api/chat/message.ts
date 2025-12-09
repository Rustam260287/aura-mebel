
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import admin from 'firebase-admin';
import { Product } from '../../../types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const extractProductTags = (data: admin.firestore.DocumentData) => {
  // Базовый текстовый сигнал
  const text = `${(data.name || '')} ${(data.description || data.description_main || '')}`.toLowerCase();
  const tags = new Set<string>();

  const add = (condition: boolean, tag: string) => {
    if (condition) tags.add(tag);
  };

  // Явные теги, если уже сохранены в БД
  const explicitTags = [
    ...(Array.isArray(data.tags) ? data.tags : []),
    ...(Array.isArray(data.styleTags) ? data.styleTags : []),
    ...(Array.isArray(data.materialTags) ? data.materialTags : []),
    ...(Array.isArray(data.colorTags) ? data.colorTags : []),
    ...(Array.isArray(data.formTags) ? data.formTags : []),
  ];
  explicitTags.forEach((t: string) => t && tags.add(String(t).toLowerCase()));

  // Форма / тип
  add(/углов/.test(text), 'угловой');
  add(/модул/.test(text), 'модульный');
  add(/прям\w*/.test(text), 'прямой');
  add(/скругл|круг|овал/.test(text), 'округлый');
  add(/пуф|банкет/.test(text), 'пуф/банкетка');

  // Стиль
  add(/ар[\s-]?дек/.test(text), 'ар-деко');
  add(/неокласс/.test(text), 'неоклассика');
  add(/лофт/.test(text), 'лофт');
  add(/минимал|minimal/.test(text), 'минимализм');
  add(/сканди/.test(text), 'скандинавский');
  add(/классик/.test(text), 'классика');

  // Материалы/фактуры
  add(/велюр|бархат|velvet/.test(text), 'велюр/бархат');
  add(/букле/.test(text), 'букле');
  add(/кожа|эко[-\s]?кожа/.test(text), 'кожа');
  add(/лен|l[iy]nen/.test(text), 'лён');
  add(/шерсть|wool/.test(text), 'шерсть');
  add(/замш|suede/.test(text), 'замша');
  add(/мрамор/.test(text), 'мрамор');
  add(/стекло/.test(text), 'стекло');
  add(/дерев|массив|ясен|дуб|орех/.test(text), 'дерево');
  add(/металл|сталь/.test(text), 'металл');
  add(/латун|бронз|золот/.test(text), 'латунь/золото');

  // Детали
  add(/капитон|стеж/.test(text), 'капитоне/стёжка');
  add(/кант/.test(text), 'кант');
  add(/пугов/.test(text), 'пуговицы');

  // Цвета
  add(/беж|молоч|крем|ivory|latte/.test(text), 'беж/молочный');
  add(/бел/.test(text), 'белый');
  add(/сер/.test(text), 'серый');
  add(/черн|black/.test(text), 'чёрный');
  add(/корич|шокол|coffee/.test(text), 'коричневый');
  add(/террак|кирпич|rust/.test(text), 'терракота');
  add(/зел/.test(text), 'зелёный');
  add(/син|бирюз|голуб/.test(text), 'синий/бирюза');
  add(/бордо|винн/.test(text), 'бордо/винный');

  return Array.from(tags);
};

const extractQueryTags = (text: string) => {
  const t = text.toLowerCase();
  const tags = new Set<string>();
  const add = (condition: boolean, tag: string) => condition && tags.add(tag);

  // Категории
  add(/диван|sofa|канапе/.test(t), 'диван');
  add(/кресл/.test(t), 'кресло');
  add(/кровать/.test(t), 'кровать');
  add(/стол/.test(t), 'стол');
  add(/стул|chair/.test(t), 'стул');
  add(/пуф|банкет/.test(t), 'пуф/банкетка');
  add(/комод|тумб/.test(t), 'комод/тумба');

  // Форма
  add(/углов/.test(t), 'угловой');
  add(/модул/.test(t), 'модульный');
  add(/прям\w*/.test(t), 'прямой');
  add(/круг|овал/.test(t), 'округлый');

  // Стиль
  add(/ар[\s-]?дек/.test(t), 'ар-деко');
  add(/неокласс/.test(t), 'неоклассика');
  add(/лофт/.test(t), 'лофт');
  add(/минимал|minimal/.test(t), 'минимализм');
  add(/сканди/.test(t), 'скандинавский');
  add(/классик/.test(t), 'классика');

  // Материалы/фактуры
  add(/велюр|бархат|velvet/.test(t), 'велюр/бархат');
  add(/букле/.test(t), 'букле');
  add(/кожа|эко[-\s]?кожа|leather/.test(t), 'кожа');
  add(/лен|l[iy]nen/.test(t), 'лён');
  add(/шерсть|wool/.test(t), 'шерсть');
  add(/замш|suede/.test(t), 'замша');
  add(/мрамор/.test(t), 'мрамор');
  add(/дерев|массив|ясен|дуб|орех/.test(t), 'дерево');
  add(/металл|сталь/.test(t), 'металл');
  add(/латун|бронз|золот/.test(t), 'латунь/золото');

  // Цвет
  add(/беж|молоч|крем|ivory|latte/.test(t), 'беж/молочный');
  add(/бел/.test(t), 'белый');
  add(/сер/.test(t), 'серый');
  add(/черн|black/.test(t), 'чёрный');
  add(/корич|шокол|coffee/.test(t), 'коричневый');
  add(/террак|кирпич|rust/.test(t), 'терракота');
  add(/зел/.test(t), 'зелёный');
  add(/син|бирюз|голуб/.test(t), 'синий/бирюза');
  add(/бордо|винн/.test(t), 'бордо/винный');

  return Array.from(tags);
};

const cosineSimilarity = (a: number[], b: number[]) => {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const buildQueryEmbedding = async (text: string) => {
  if (!text || !process.env.OPENAI_API_KEY) return null;
  try {
    const completion = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 2000),
    });
    return completion.data?.[0]?.embedding || null;
  } catch (err) {
    console.error('Embedding error:', err);
    return null;
  }
};

const parseDimensions = (text: string) => {
  const lower = (text || '').toLowerCase();
  const findVal = (keys: string[]) => {
    for (const key of keys) {
      const regex = new RegExp(`${key}[\\s:]*([0-9]{2,4})`, 'i');
      const match = lower.match(regex);
      if (match?.[1]) return Number(match[1]);
      const regexAfter = new RegExp(`([0-9]{2,4})[\\s]*${key}`, 'i');
      const matchAfter = lower.match(regexAfter);
      if (matchAfter?.[1]) return Number(matchAfter[1]);
    }
    return undefined;
  };
  return {
    length: findVal(['длина', 'l=', 'l ']),
    width: findVal(['ширина', 'w=', 'w ']),
    depth: findVal(['глубина', 'depth', 'd=', 'd ']),
    height: findVal(['высота', 'h=', 'h ']),
  };
};

const sizePenalty = (userDims: any, prodDims: any) => {
  if (!userDims) return 0;
  let penalty = 0;
  const compare = (u?: number, p?: number) => {
    if (!u || !p) return 0;
    const diff = Math.abs(u - p) / u;
    if (diff > 0.3) return -2;
    if (diff > 0.2) return -1;
    if (diff < 0.1) return 0.5;
    return 0;
  };
  penalty += compare(userDims.length, prodDims.length);
  penalty += compare(userDims.width, prodDims.width);
  penalty += compare(userDims.depth, prodDims.depth);
  penalty += compare(userDims.height, prodDims.height);
  return penalty;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    const { message, history, imageUrl } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    const db = getAdminDb();
    let productsContext = "Каталог пуст.";
    const userDims = parseDimensions(message);
    let candidates: any[] = [];
    
    if (db) {
        // Берем больше товаров и добавляем короткие теги формы/стиля/материалов/цветов
        const snapshot = await db.collection('products').limit(140).get();
        const allProducts = snapshot.docs.map(doc => {
            const d = doc.data();
            const tags = extractProductTags(d);
            const fullDesc = (d.description || d.description_main || '').toString();
            const prodDims = parseDimensions(`${fullDesc} ${d?.details?.dimensions || ''}`);
            let desc = fullDesc.replace(/\s+/g, ' ').trim();
            if (desc.length > 120) desc = desc.substring(0, 120) + "...";
            const tagList = Array.from(new Set(tags));
            return {
              id: doc.id,
              name: d.name,
              category: d.category || '',
              price: d.price,
              tags: tagList,
              desc,
              embedding: Array.isArray(d.embedding) ? d.embedding : null,
              dims: prodDims,
              imageUrls: Array.isArray(d.imageUrls) ? d.imageUrls : [],
            };
        });

        const queryTags = extractQueryTags(message);
        const categoryHint = extractQueryTags(history.map((h: any) => h.content || '').join(' '));

        const withEmbeddings = allProducts.filter(p => Array.isArray(p.embedding) && p.embedding.length > 0);
        candidates = allProducts;

        if (withEmbeddings.length > 10) {
          const queryEmbedding = await buildQueryEmbedding(message);
          if (queryEmbedding) {
            candidates = withEmbeddings
              .map(p => ({ ...p, score: cosineSimilarity(queryEmbedding, p.embedding as number[]) + sizePenalty(userDims, p.dims || {}) }))
              .sort((a, b) => (b.score || 0) - (a.score || 0))
              .slice(0, imageUrl ? 30 : 30);
          }
        }

        if (candidates === allProducts || candidates.length === 0) {
          const scored = allProducts.map(p => {
            let score = 0;
            const set = new Set(p.tags);
            queryTags.forEach(tag => set.has(tag) && (score += 2));
            categoryHint.forEach(tag => set.has(tag) && (score += 1));
            score += sizePenalty(userDims, p.dims || {});
            return { ...p, score };
          });
          candidates = scored.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, imageUrl ? 30 : 30);
        }

        productsContext = candidates.map(p => {
            return `ID: ${p.id}; Название: ${p.name}; Категория: ${p.category}; Цена: ${p.price} руб.; Теги: ${p.tags.join(', ') || 'нет'}; Описание: ${p.desc}`;
        }).join('\n');
    }

    // --- ОБНОВЛЕННЫЙ ПРОМПТ "КОМАНДА ЭКСПЕРТОВ 2.0" ---
    const systemInstruction = `
    Ты — "Labelcom Intelligence", элитный цифровой консилиум мебельного дома.
    Ты не просто бот, а команда из трех виртуозов, работающих синхронно:

    1. 🧠 ИНЖЕНЕР-ТЕХНОЛОГ (отвечает за функционал):
       - Анализирует габариты (влезет ли?), эргономику (удобно ли?) и материалы (прочно ли?).
       - Знает стандарты: диван глубина 95-110см, кровать длина 200см+.
       - Если клиент дал фото — оценивает конструктив.

    2. 🎨 ДИЗАЙНЕР ИНТЕРЬЕРОВ (отвечает за эстетику):
       - Считывает стиль (ар-деко, минимализм, лофт, неоклассика).
       - Видит палитру и фактуры (бархат, букле, кожа, латунь).
       - Подбирает мебель так, чтобы она "собрала" интерьер.

    3. 💼 МЕНЕДЖЕР ПРОЕКТОВ (отвечает за результат):
       - Ведет клиента к покупке или заказу.
       - Если в каталоге нет идеала — сразу предлагает изготовление по фото/эскизу.
       - Всегда вежлив, лаконичен, не "душит" вопросами.

    ТВОИ ЗАДАЧИ:
    1. **Анализ**: Если есть фото — начни с комплимента или проф. оценки стиля/предмета. ("Вижу роскошный диван в стиле итальянского модерна...").
    2. **Подбор**: Найди в КАТАЛОГЕ (ниже) 2-3 наиболее похожих или подходящих товара.
       - Используй ТОЛЬКО ID из списка.
       - Если точного совпадения нет — покажи похожие по духу/форме и ОБЪЯСНИ разницу ("Форма похожа, но у нас в велюре, а не в рогожке").
    3. **Продажа / Кастом**:
       - Если товары подходят — предложи оформить.
       - Если товары "не совсем то" — предложи "Изготовление по фото".
       - В конце задай ОДИН вовлекающий вопрос (про размер, цвет или сроки), чтобы продолжить диалог.

    КАТАЛОГ ТОВАРОВ (извлечение):
    ${productsContext}
    
    ПРАВИЛА ОБЩЕНИЯ:
    - Пиши от лица "мы" (команда Labelcom).
    - Будь экспертен, но понятен. Не используй штампы "индивидуальный подход", говори по делу.
    - Ответ структурируй: "Анализ -> Предложения -> Следующий шаг".
    - Не предлагай товары из других категорий (на запрос "стол" не шли диван).

    ФОРМАТ ОТВЕТА (JSON):
    {
      "reply": "Текст ответа (HTML разметка разрешена, например <b>жирный</b>).",
      "recommendedProductIds": ["ID_1", "ID_2"],
      "offerCustom": true/false (true если нужно предложить изготовление на заказ),
      "hideCustomCta": true/false (true если НЕ нужно показывать кнопку кастома, например если товары идеальны),
      "quickReplies": ["Вариант 1", "Вариант 2"] (короткие фразы для быстрого ответа пользователя, например 'Хочу в другом цвете', 'А есть дешевле?', 'Заказать по фото')
    }
    `;
    
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: systemInstruction },
        ...history.map((msg: any) => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
        })),
    ];

    const buildImageContent = async (url: string) => url;

    let userContent: any = [{ type: "text", text: message }];
    
    if (imageUrl) {
        const visionUrl = imageUrl.startsWith('http')
            ? await buildImageContent(imageUrl)
            : imageUrl;
        userContent.push({
            type: "image_url",
            image_url: {
                url: visionUrl,
                detail: "auto"
            }
        });
    }

    messages.push({ role: "user", content: userContent });

    let responseText: string | null = null;
    try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o", 
          messages: messages,
          response_format: { type: "json_object" },
          max_tokens: 1000, 
          temperature: 0.7,
        });
        responseText = completion.choices[0].message.content;
    } catch (err) {
        console.error("OpenAI chat error:", err);
        return res.status(200).json({
          reply: "Наш консилиум сейчас перегружен запросами. Попробуйте уточнить параметры (цвет, размер) — мы сразу вернемся с решением.",
          products: [],
          offerCustom: true,
          quickReplies: ["Попробовать снова"]
        });
    }
    
    let jsonResponse;
    try {
        if (!responseText) throw new Error("Empty response");
        jsonResponse = JSON.parse(responseText);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        jsonResponse = { 
            reply: "Произошла техническая заминка. Пожалуйста, уточните ваш запрос.", 
            recommendedProductIds: [], 
            offerCustom: true,
            quickReplies: ["Подобрать диван", "Подобрать кровать", "Связаться с менеджером"]
        };
    }

    let products: (Product | admin.firestore.DocumentData)[] = [];
    if (jsonResponse.recommendedProductIds?.length > 0 && db) {
        try {
            const ids = jsonResponse.recommendedProductIds.slice(0, 10).filter((id: string) => id && id.length > 5);
            if (ids.length > 0) {
                const productsSnapshot = await db.collection('products').where(admin.firestore.FieldPath.documentId(), 'in', ids).get();
                products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
        } catch (e) {
            console.error("Error fetching recommended products:", e);
        }
    }

    // Fallback logic
    if (products.length === 0 && candidates && Array.isArray(candidates)) {
      products = candidates.slice(0, 3).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        imageUrls: p.imageUrls || [],
        category: p.category,
      })) as any[];
      if (!jsonResponse.reply) {
        jsonResponse.reply = "Мы проанализировали ваш запрос. Вот модели из наличия, наиболее близкие по стилю. Если вы ищете что-то уникальное — мы можем изготовить это по вашему фото.";
      }
      jsonResponse.offerCustom = true;
    }

    const computedHideCta = (!jsonResponse.offerCustom && products.length >= 2);
    const hideCustomCta = Boolean(jsonResponse.hideCustomCta || computedHideCta);
    const offerCustom = Boolean(jsonResponse.offerCustom || products.length === 0);
    const quickReplies = Array.isArray(jsonResponse.quickReplies) ? jsonResponse.quickReplies.slice(0, 4) : [];

    res.status(200).json({ 
        reply: jsonResponse.reply, 
        products, 
        offerCustom, 
        hideCustomCta,
        quickReplies 
    });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    res.status(200).json({
      reply: "Возникла ошибка соединения с сервером. Повторите попытку.",
      products: [],
      offerCustom: true,
      quickReplies: ["Повторить"]
    });
  }
}
