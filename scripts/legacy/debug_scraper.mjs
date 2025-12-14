
import fetch from 'node-fetch';
import fs from 'fs/promises';

async function debugScraper() {
  const url = 'https://label-com.ru/katalog';
  console.log(`Fetching HTML from ${url}...`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch page. Status: ${response.status}`);
      return;
    }
    const body = await response.text();
    
    // Сохраняем HTML в файл для анализа
    await fs.writeFile('debug_page.html', body, 'utf-8');
    console.log('Successfully saved page content to debug_page.html');
    console.log('Please inspect debug_page.html to find the correct CSS selectors for product links.');

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

debugScraper();
