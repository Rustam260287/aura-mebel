
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://label-com.ru';
const CATALOG_URL = `${BASE_URL}/katalog.html`;

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
  console.log('🔍 Сканирую список категорий...');
  const html = await fetchPage(CATALOG_URL);
  if (!html) return [];
  const $ = cheerio.load(html);
  const links = new Set();
  
  // Ищем ссылки, которые выглядят как категории
  $('a[href^="/katalog/"]').each((i, el) => {
      const href = $(el).attr('href');
      // Исключаем системные ссылки, корзину, детали товара
      if (href && !href.includes('-detail') && !href.includes('cart') && !href.includes('results') && href !== '/katalog.html') {
          links.add(BASE_URL + href);
      }
  });
  
  const result = Array.from(links);
  console.log(`✅ Найдено ${result.length} категорий.`);
  return result;
}

async function getProductLinksFromCategoryRecursive(categoryUrl, visitedPages = new Set()) {
    if (visitedPages.has(categoryUrl)) return [];
    visitedPages.add(categoryUrl);

    console.log(`  📂 Сканирую страницу категории: ${categoryUrl}`);
    const html = await fetchPage(categoryUrl);
    if (!html) return [];
    const $ = cheerio.load(html);
    
    const productLinks = new Set();
    
    // Сбор товаров на текущей странице
    $('a[href*="-detail"]').each((i, el) => {
        let href = $(el).attr('href');
        if (href) {
            if (!href.startsWith('http')) href = BASE_URL + href;
            productLinks.add(href);
        }
    });

    console.log(`     -> Найдено ${productLinks.size} товаров на странице.`);

    // Поиск следующей страницы
    // Ищем ссылку, которая выглядит как следующая страница в пагинации
    // Обычно это кнопка "Вперед" или "Next", или просто следующая цифра
    // В label-com пагинация: <a href="/katalog/results,22-42.html" title="Следующая">Вперёд</a>
    
    let nextPageUrl = null;
    
    // Попробуем найти кнопку "Вперёд" или title="Следующая"
    const nextLink = $('a[title="Следующая"], a:contains("Вперёд"), .pagination-next a').first();
    
    if (nextLink.length > 0) {
        const href = nextLink.attr('href');
        if (href) {
            nextPageUrl = href.startsWith('http') ? href : BASE_URL + href;
        }
    }

    let allLinks = Array.from(productLinks);

    if (nextPageUrl && !visitedPages.has(nextPageUrl)) {
        console.log(`     -> Найдена следующая страница: ${nextPageUrl}`);
        const nextLinks = await getProductLinksFromCategoryRecursive(nextPageUrl, visitedPages);
        allLinks = [...allLinks, ...nextLinks];
    }

    return allLinks;
}

async function parseProductPage(url) {
    const html = await fetchPage(url);
    if (!html) return null;
    const $ = cheerio.load(html);

    let name = $('h1').first().text().trim();
    let price = 0;
    let imageUrls = [];
    let description = '';
    let category = 'Каталог';

    // Цена
    const priceContainer = $('.product-price .PricesalesPrice').last();
    const priceText = priceContainer.text().replace('Цена', '').trim();
    price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;

    // Изображения
    // Главное изображение
    let mainImg = $('.main-image img').attr('src');
    if (mainImg) {
        if (!mainImg.startsWith('http')) mainImg = BASE_URL + mainImg;
        imageUrls.push(mainImg);
    }
    
    // Дополнительные изображения (если есть галерея)
    $('.additional-images img').each((i, el) => {
        let src = $(el).attr('src');
        if (src) {
             if (!src.startsWith('http')) src = BASE_URL + src;
             if (!imageUrls.includes(src)) imageUrls.push(src);
        }
    });

    // Описание
    description = $('.product-description').text().trim();

    // Категория и очистка имени
    if (name.includes(':')) {
        const parts = name.split(':');
        if (parts.length > 1) {
            category = parts[0].trim();
            name = parts.slice(1).join(':').trim();
        }
    }

    if (!name) return null;

    return {
        name,
        price,
        description,
        imageUrls,
        category,
        originalUrl: url
    };
}

async function run() {
    console.log('🚀 Запуск полного парсера...');
    const categoryLinks = await getCategoryLinks();
    
    let allProductLinks = new Set();

    // Сканируем ВСЕ категории с пагинацией
    for (const catLink of categoryLinks) {
        const prodLinks = await getProductLinksFromCategoryRecursive(catLink);
        prodLinks.forEach(link => allProductLinks.add(link));
    }

    const uniqueLinks = Array.from(allProductLinks);
    console.log(`\n🎉 Всего найдено уникальных товаров: ${uniqueLinks.length}`);
    
    const resultProducts = [];
    
    // Парсим страницы товаров
    for (let i = 0; i < uniqueLinks.length; i++) {
        const link = uniqueLinks[i];
        if (i % 10 === 0) console.log(`⏳ Прогресс: ${i}/${uniqueLinks.length} товаров...`);
        
        try {
            const product = await parseProductPage(link);
            if (product) {
                resultProducts.push(product);
            }
        } catch (e) {
            console.error(`Ошибка при парсинге ${link}: ${e.message}`);
        }
        
        // Маленькая задержка, чтобы не заблокировали
        // await new Promise(r => setTimeout(r, 50)); 
    }

    fs.writeFileSync('all_products_full.json', JSON.stringify(resultProducts, null, 2));
    console.log(`\n✅ Успешно спарсено ${resultProducts.length} товаров.`);
    console.log('💾 Сохранено в all_products_full.json');
}

run();
