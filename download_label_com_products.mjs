import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { setTimeout as sleep } from 'timers/promises';

const BASE_URL = 'https://label-com.ru';
const CATALOG_URL = `${BASE_URL}/katalog.html`;
const OUTPUT_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'label-com-download');
const IMAGES_ROOT = path.join(OUTPUT_ROOT, 'images');
const DATA_FILE = path.join(OUTPUT_ROOT, 'products.json');
const REQUEST_PAUSE_MS = 120;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const toAbsolute = (url) => (url.startsWith('http') ? url : `${BASE_URL}${url}`);

async function fetchText(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(200 * attempt);
    }
  }
}

async function fetchBuffer(url, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      return { buffer: Buffer.from(arrayBuffer), contentType: res.headers.get('content-type') || '' };
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(200 * attempt);
    }
  }
}

function slugify(originalUrl, name, index) {
  const urlPart = originalUrl?.split('/').filter(Boolean).pop() || '';
  const base = urlPart.replace(/-detail\.html?$/i, '') || name || `product-${index}`;
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `product-${index}`;
}

function pickExtension(sourceUrl, contentType) {
  const fromUrl = (sourceUrl.match(/\.([a-zA-Z0-9]+)(?:$|\?)/) || [])[1];
  if (fromUrl) return fromUrl.toLowerCase();
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  return 'jpg';
}

function extractImages($, pageUrl) {
  const images = new Set();

  const mainHref = $('a.main-image.modal').attr('href') || $('.main-image img').attr('src');
  if (mainHref) images.add(toAbsolute(mainHref));

  $('a[data-rel="lightcase:my-images"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) images.add(toAbsolute(href));
  });

  $('.additional-images img').each((_, el) => {
    const src = $(el).attr('src');
    if (src) images.add(toAbsolute(src));
  });

  // Fallback: any image that looks like a product photo
  $('img[src*="/product/"]').each((_, el) => {
    const src = $(el).attr('src');
    if (src) images.add(toAbsolute(src));
  });

  return Array.from(images);
}

function addNumberedGuesses(imageUrls) {
  if (imageUrls.length === 0) return imageUrls;

  const urls = new Set(imageUrls);
  const first = imageUrls[0];

  // Пытаемся угадать серию вида .../niza.png -> niza1.png, niza2.png...
  const match = first.match(/^(.*\/)(.*?)(\d+)?(\.[a-z0-9]+)$/i);
  if (!match) return imageUrls;

  const [_, baseUrl, baseName, numberPart, ext] = match;

  // Собираем существующие номера, чтобы не дублировать
  const existingNumbers = new Set();
  imageUrls.forEach((url) => {
    const m = url.match(/^(.*\/)(.*?)(\d+)(\.[a-z0-9]+)$/i);
    if (m && m[3]) existingNumbers.add(Number(m[3]));
  });

  for (let i = 1; i <= 7; i++) {
    if (numberPart && Number(numberPart) === i) continue;
    if (existingNumbers.has(i)) continue;
    const candidate = `${baseUrl}${baseName}${i}${ext}`;
    urls.add(candidate);
  }

  return Array.from(urls);
}

async function downloadImages(slug, urls) {
  const folder = path.join(IMAGES_ROOT, slug);
  await fs.mkdir(folder, { recursive: true });

  const saved = [];
  let index = 1;

  for (const url of urls) {
    try {
      const { buffer, contentType } = await fetchBuffer(url);
      const extension = pickExtension(url, contentType);
      const fileName = `${String(index).padStart(2, '0')}.${extension}`;
      const destination = path.join(folder, fileName);

      await fs.writeFile(destination, buffer);
      saved.push(path.relative(OUTPUT_ROOT, destination));
      index++;
      await sleep(REQUEST_PAUSE_MS);
    } catch (err) {
      console.warn(`    ! Пропуск ${url}: ${err.message}`);
    }
  }

  return saved;
}

async function getCategoryLinks() {
  const html = await fetchText(CATALOG_URL);
  const $ = cheerio.load(html);
  const links = new Set();

  $('a[href^="/katalog/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (
      href &&
      !href.includes('-detail') &&
      !href.includes('cart') &&
      !href.includes('results') &&
      href !== '/katalog.html'
    ) {
      links.add(toAbsolute(href));
    }
  });

  return Array.from(links);
}

async function collectProductLinks(categoryUrl, visitedPages, collected) {
  if (visitedPages.has(categoryUrl)) return;
  visitedPages.add(categoryUrl);

  const html = await fetchText(categoryUrl);
  const $ = cheerio.load(html);

  $('a[href*="-detail"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) collected.add(toAbsolute(href.split('#')[0]));
  });

  const next = $('a[title="Следующая"], a:contains("Вперёд")').first();
  if (next.length) {
    const href = next.attr('href');
    if (href) {
      const nextUrl = toAbsolute(href);
      if (!visitedPages.has(nextUrl)) {
        await sleep(REQUEST_PAUSE_MS);
        await collectProductLinks(nextUrl, visitedPages, collected);
      }
    }
  }
}

async function parseProduct(url, index) {
  const html = await fetchText(url);
  const $ = cheerio.load(html);

  const name = $('h1.product-title, h1').first().text().trim() || `Товар ${index + 1}`;
  const priceText =
    $('.product-price .PricesalesPrice, .product-price .PricebasePrice')
      .first()
      .text()
      .replace(/[^0-9]/g, '') || '0';
  const price = Number.parseInt(priceText, 10) || 0;
  const category = $('.breadcrumb .pathway a').eq(1).text().trim() || 'Каталог';
  const description = $('.product-description').text().trim();
  const images = addNumberedGuesses(extractImages($, url));
  const slug = slugify(url, name, index);

  if (images.length === 0) {
    console.warn(`  ⚠️  Нет картинок для ${name} (${url})`);
  }

  const localImages = await downloadImages(slug, images);

  return {
    slug,
    name,
    price,
    category,
    description,
    originalUrl: url,
    imageUrls: images,
    localImages,
  };
}

async function main() {
  await fs.mkdir(IMAGES_ROOT, { recursive: true });

  console.log('📂 Сканирую категории...');
  const categories = await getCategoryLinks();
  console.log(`Найдено категорий: ${categories.length}`);

  const visitedPages = new Set();
  const productLinks = new Set();

  for (const cat of categories) {
    await collectProductLinks(cat, visitedPages, productLinks);
    await sleep(REQUEST_PAUSE_MS);
  }

  const links = Array.from(productLinks);
  console.log(`Всего товаров найдено: ${links.length}`);

  const products = [];

  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    console.log(`\n(${i + 1}/${links.length}) Парсинг ${link}`);
    try {
      const product = await parseProduct(link, i);
      products.push(product);
    } catch (err) {
      console.error(`  Ошибка парсинга ${link}: ${err.message}`);
    }
    await sleep(REQUEST_PAUSE_MS);
  }

  await fs.writeFile(DATA_FILE, JSON.stringify(products, null, 2));
  console.log(`\n✅ Готово. Сохранено ${products.length} товаров.`);
  console.log(`📦 Данные: ${path.relative(process.cwd(), DATA_FILE)}`);
  console.log(`🖼️  Фото:  ${path.relative(process.cwd(), IMAGES_ROOT)}`);
}

main().catch((err) => {
  console.error('Сбой:', err);
  process.exit(1);
});
