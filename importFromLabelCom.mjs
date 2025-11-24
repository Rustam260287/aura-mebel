
// ... (предыдущий код без изменений до parseProductPage)
import * as cheerio from 'cheerio';
import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Если вы хотите сразу загружать в БД, раскомментируйте и настройте serviceAccount
// const serviceAccount = require('./serviceAccountKey.json');
// initializeApp({ credential: cert(serviceAccount) });
// const db = getFirestore();

const BASE_URL = 'https://label-com.ru';
const CATALOG_URL = `${BASE_URL}/katalog.html`;

// ... fetchPage, getCategoryLinks, getProductLinksFromCategory (без изменений) ...
async function fetchPage(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return null;
  }
}

async function getCategoryLinks() {
  console.log('--- Scanning Categories ---');
  const html = await fetchPage(CATALOG_URL);
  if (!html) return [];
  const $ = cheerio.load(html);
  const links = new Set();
  $('a[href^="/katalog/"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && !href.includes('-detail') && !href.includes('cart') && href !== '/katalog.html') {
          links.add(BASE_URL + href);
      }
  });
  return Array.from(links);
}

async function getProductLinksFromCategory(categoryUrl) {
    console.log(`Scanning category: ${categoryUrl}`);
    const html = await fetchPage(categoryUrl);
    if (!html) return [];
    const $ = cheerio.load(html);
    const productLinks = new Set();
    $('a[href*="-detail"]').each((i, el) => {
        let href = $(el).attr('href');
        if (href) {
            productLinks.add(BASE_URL + href);
        }
    });
    return Array.from(productLinks);
}

async function parseProductPage(url) {
    const html = await fetchPage(url);
    if (!html) return null;
    const $ = cheerio.load(html);

    let name = $('h1').first().text().trim();
    let price = 0;
    let imageUrl = '';
    let description = '';
    let category = 'Каталог';

    // CSS селекторы
    const priceContainer = $('.product-price .PricesalesPrice').last();
    const priceText = priceContainer.text().replace('Цена', '').trim();
    price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;

    imageUrl = $('.main-image img').attr('src');
    if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = BASE_URL + imageUrl;
    }

    description = $('.product-description').text().trim();

    // Улучшенное определение категории и названия
    // Если название вида "Категория : Товар", разбиваем его
    if (name.includes(':')) {
        const parts = name.split(':');
        if (parts.length > 1) {
            category = parts[0].trim();
            name = parts.slice(1).join(':').trim(); // Остальное - имя
        }
    }

    if (!name) return null;

    return {
        name,
        price,
        description,
        imageUrls: [imageUrl], // Массив для совместимости с вашей БД
        category,
        originalUrl: url
    };
}

async function run() {
    const categoryLinks = await getCategoryLinks();
    let allProductLinks = [];

    // Сканируем ВСЕ категории
    for (const catLink of categoryLinks) {
        const prodLinks = await getProductLinksFromCategory(catLink);
        allProductLinks = [...allProductLinks, ...prodLinks];
    }

    // Удаляем дубликаты ссылок
    allProductLinks = [...new Set(allProductLinks)];
    console.log(`Total unique products found: ${allProductLinks.length}`);
    
    const resultProducts = [];
    
    // Парсим товары партиями, чтобы не перегрузить сайт
    // Но для скорости сейчас сделаем последовательно
    for (let i = 0; i < allProductLinks.length; i++) {
        const link = allProductLinks[i];
        console.log(`[${i+1}/${allProductLinks.length}] Parsing ${link}...`);
        const product = await parseProductPage(link);
        if (product) {
            resultProducts.push(product);
        }
        // Небольшая задержка, чтобы быть вежливым к серверу
        // await new Promise(r => setTimeout(r, 100)); 
    }

    fs.writeFileSync('all_products.json', JSON.stringify(resultProducts, null, 2));
    console.log(`Successfully parsed ${resultProducts.length} products.`);
    console.log('Saved to all_products.json');
}

run();
