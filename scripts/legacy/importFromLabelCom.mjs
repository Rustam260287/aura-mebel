
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';

const BASE_URL = 'https://label-com.ru';
// Использование прокси для обхода блокировки
const PROXY_URL = 'https://proxy.scrapeops.io/v1/?api_key=YOUR_API_KEY&url='; // Замените YOUR_API_KEY на ключ, если потребуется

function getProxiedUrl(url) {
    return `${PROXY_URL}${encodeURIComponent(url)}`;
}

async function getAllProductLinks() {
    const allLinks = new Set();
    for (let i = 1; i <= 20; i++) {
        const url = `${BASE_URL}/katalog?start=${(i - 1) * 20}`;
        try {
            const response = await fetch(getProxiedUrl(url)); // Используем прокси
            if (!response.ok) {
                console.log(`Page ${i} not found or error, stopping.`);
                break;
            }
            const body = await response.text();
            const $ = cheerio.load(body);
            const linksOnPage = $('.item .product-image-link').map((_, el) => $(el).attr('href')).get();
            
            if (linksOnPage.length === 0) {
                console.log(`No products found on page ${i}, assuming end of catalog.`);
                break;
            }
            
            linksOnPage.forEach(link => allLinks.add(BASE_URL + link));
            console.log(`Found ${linksOnPage.length} links on page ${i}. Total unique links: ${allLinks.size}`);
        } catch (error) {
            console.error(`Error fetching page ${i}:`, error);
            break;
        }
    }
    return Array.from(allLinks);
}

async function getProductDetails(url) {
    try {
        const response = await fetch(getProxiedUrl(url)); // Используем прокси
        const body = await response.text();
        const $ = cheerio.load(body);

        const name = $('h1.product-title').text().trim();
        const priceText = $('.product-price .PricesalesPrice').text().trim() || $('.product-price .PricebasePrice').text().trim();
        const price = parseInt(priceText.replace(/\s/g, ''), 10);
        const description = $('.product-description').text().trim();
        const category = $('.breadcrumb .pathway a').eq(1).text().trim();
        const mainImageUrl = $('a.main-image.modal').attr('href');
        const imageUrls = mainImageUrl ? [BASE_URL + mainImageUrl] : [];

        console.log(`- Parsed: ${name}`);
        return { name, price, description, imageUrls, category, originalUrl: url };
    } catch (error) {
        console.error(`Error fetching product details for ${url}:`, error);
        return null;
    }
}

async function main() {
    console.log('Starting product import via proxy to avoid blocking...');
    const productLinks = await getAllProductLinks();
    
    const allProducts = [];
    for (const link of productLinks) {
        const product = await getProductDetails(link);
        if (product && product.imageUrls.length > 0 && !isNaN(product.price)) {
            allProducts.push(product);
        } else {
            console.log(`- Skipping product with missing data: ${product ? product.name : link}`);
        }
    }
    
    await fs.writeFile('all_products_final.json', JSON.stringify(allProducts, null, 2));
    console.log(`Successfully parsed ${allProducts.length} products and saved to all_products_final.json`);
}

main();
