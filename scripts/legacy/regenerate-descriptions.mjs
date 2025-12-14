
import fs from 'fs/promises';
import { GoogleGenerativeAI } from '@google/generative-ai';

const FINAL_PRODUCTS_FILE = 'all_products_final.json';
const API_KEY = process.env.GEMINI_API_KEY; 

if (!API_KEY) {
  throw new Error('Missing GEMINI_API_KEY in environment variables.');
}

const genAI = new GoogleGenerativeAI(API_KEY);
// Изменено на более стабильную модель gemini-pro
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

async function generateDescriptions() {
  console.log('Reading final product data...');
  const productsContent = await fs.readFile(FINAL_PRODUCTS_FILE, 'utf-8');
  const products = JSON.parse(productsContent);

  console.log(`Starting description generation for ${products.length} products using gemini-pro...`);

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    console.log(`(${i + 1}/${products.length}) Generating description for: ${product.name}`);

    const prompt = `
      Создай короткое (2-3 предложения), стильное и премиальное маркетинговое описание для предмета мебели.
      Не используй заезженные фразы вроде "окунитесь в мир роскоши". Будь более утонченным.
      
      Название товара: "${product.name}"
      Категория: "${product.category}"
      Технические характеристики (не включай их в описание, используй для контекста): "${product.description_specs}"

      Пример хорошего описания:
      "Коллекция 'Агата' — это воплощение элегантности, построенное на контрасте простых форм и изысканных деталей. Нейтральная цветовая гамма создает ощущение тепла и уюта, превращая вашу спальню в идеальное место для отдыха."

      Твоё описание:
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const newDescription = response.text().trim();
      
      product.description_main = newDescription;
      console.log(`  ✓  Generated: "${newDescription.substring(0, 50)}..."`);
      
      await new Promise(resolve => setTimeout(resolve, 1000)); 

    } catch (error) {
      console.error(`  ✗ Error generating description for ${product.name}:`, error.message);
      product.description_main = product.description_main || "Описание скоро появится...";
    }
  }

  console.log('All descriptions have been generated. Saving to file...');
  await fs.writeFile(FINAL_PRODUCTS_FILE, JSON.stringify(products, null, 2));
  console.log(`Successfully updated ${FINAL_PRODUCTS_FILE} with new descriptions!`);
}

generateDescriptions();
