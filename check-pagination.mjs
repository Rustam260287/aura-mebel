
import * as cheerio from 'cheerio';

async function checkPagination() {
  const url = 'https://label-com.ru/katalog/stulja.html'; // Пример категории, где много товаров
  console.log(`Checking pagination for: ${url}`);
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Ищем элементы пагинации
    console.log('Pagination links found:');
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        // Обычно пагинация содержит 'start=' или 'page=' или цифры
        if (href && (href.includes('start=') || (text.match(/^\d+$/) && href.includes('katalog')))) {
             console.log(`- Text: "${text}", Href: ${href}`);
        }
    });

    // Посмотрим общее количество товаров, если указано
    console.log('Total products hint:', $('.vm-result-cnt').text().trim() || 'Not found');
    
  } catch (error) {
    console.error(error);
  }
}

checkPagination();
