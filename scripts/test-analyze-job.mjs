
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const dirtyDescription = `Описание
    	



 

 





 
 
Окружите себя непревзойдённой красотой этой модели! Настолько она красивая в реальности, просто надо увидеть один раз, чтобы влюбиться.
 
Габаритные номинальные размеры
Диван
• Длина 2,20 м• Глубина 1 м• Высота 130 см• Сиденье дивана 167x70 см
 
Кресло
• Длина 120 см• Глубина 90 см• Высота 130 см•Сиденье кресла 53x60 см
 
Материалы
• Декор - Пенополиуретан• Обивка - Ткани от ведущих поставщиков• Каркас - Фанера+сосна
 
Диван не раскладной`;

async function testAI() {
    console.log("--- STARTING TEST ---");
    
    // 1. Очистка текста (важно!)
    const cleanDescription = dirtyDescription
        .replace(/\s+/g, ' ') // Заменяем множественные пробелы и переносы на один пробел
        .trim();

    console.log("Cleaned description:", cleanDescription);

    const prompt = `
      Analyze the following product description and extract key specifications into a JSON format.
      Target fields: "width" (in cm), "depth" (in cm), "height" (in cm), "material" (main material), "color", "sleeping_area" (if applicable).
      If a value is not found, leave it as null or an empty string.
      
      Description:
      "${cleanDescription}"
      
      Return ONLY valid JSON.
    `;

    try {
        console.log("Sending request to OpenAI...");
        const start = Date.now();
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-3.5-turbo",
            response_format: { type: "json_object" },
        });
        const end = Date.now();
        console.log(`OpenAI responded in ${(end - start) / 1000}s`);

        const result = completion.choices[0].message.content;
        console.log("Result:", result);
        const json = JSON.parse(result);
        console.log("Parsed JSON:", json);

    } catch (error) {
        console.error("Error:", error);
    }
}

testAI();
