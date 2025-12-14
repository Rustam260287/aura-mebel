
import puppeteer from 'puppeteer';
import fs from 'fs/promises';

const BASE_URL = 'https://label-com.ru';

async function scrapeWithBrowser() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  
  // Устанавливаем User-Agent, чтобы сайт думал, что мы обычный пользователь
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  const allProducts = [];
  const processedLinks = new Set();

  for (let i = 1; i <= 20; i++) {
    const url = `${BASE_URL}/katalog?start=${(i - 1) * 20}`;
    console.log(`Navigating to page ${i}: ${url}`);
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      
      // Ищем ссылки на товары
      const links = await page.evaluate((baseUrl) => {
        const elements = document.querySelectorAll('.product-image-link');
        return Array.from(elements).map(el => baseUrl + el.getAttribute('href'));
      }, BASE_URL);

      if (links.length === 0) {
        console.log(`No products found on page ${i}, finishing.`);
        break;
      }

      console.log(`Found ${links.length} products on page ${i}. Processing...`);

      for (const link of links) {
        if (processedLinks.has(link)) continue;
        processedLinks.add(link);

        try {
          await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 });
          
          const productData = await page.evaluate((url) => {
            const nameEl = document.querySelector('h1.product-title');
            const priceEl = document.querySelector('.product-price .PricesalesPrice') || document.querySelector('.product-price .PricebasePrice');
            const descEl = document.querySelector('.product-description');
            const categoryEl = document.querySelector('.breadcrumb .pathway a:nth-child(3)') || document.querySelector('.breadcrumb .pathway a:nth-child(2)'); // Пробуем разные варианты хлебных крошек
            const imgEl = document.querySelector('a.main-image.modal');

            if (!nameEl || !priceEl) return null;

            const name = nameEl.innerText.trim();
            const price = parseInt(priceEl.innerText.replace(/\s/g, ''), 10);
            const description = descEl ? descEl.innerText.trim() : '';
            const category = categoryEl ? categoryEl.innerText.trim() : 'Мебель';
            
            // Получаем полный URL картинки
            const imgHref = imgEl ? imgEl.getAttribute('href') : null;
            const imageUrls = imgHref ? [new URL(imgHref, document.baseURI).href] : []; // Превращаем относительный путь в абсолютный

            return { name, price, description, category, imageUrls, originalUrl: url };
          }, link);

          if (productData) {
            allProducts.push(productData);
            console.log(`+ Parsed: ${productData.name} (${productData.price}₽)`);
          }
        } catch (err) {
          console.error(`Failed to parse product: ${link}`, err.message);
        }
      }

    } catch (err) {
      console.error(`Error loading page ${i}:`, err.message);
      break;
    }
  }

  await browser.close();

  console.log(`\nFinished! Total products parsed: ${allProducts.length}`);
  await fs.writeFile('all_products_final.json', JSON.stringify(allProducts, null, 2));
  console.log('Saved to all_products_final.json');
}

scrapeWithBrowser();
