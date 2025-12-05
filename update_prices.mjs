
import fs from 'fs/promises';

async function updatePrices() {
  const inputFile = 'all_products_final.json';
  const outputFile = 'all_products_new_prices.json';

  try {
    // 1. Read the file
    const data = await fs.readFile(inputFile, 'utf-8');
    const products = JSON.parse(data);

    let updatedCount = 0;
    // 2. Update prices
    const updatedProducts = products.map(product => {
      if (product.price) {
        let newPrice;
        if (product.category === 'Кухни') {
          // Increase by 30% for kitchens
          newPrice = Math.round(product.price * 1.3);
        } else {
          // Increase by 20% for everything else
          newPrice = Math.round(product.price * 1.2);
        }
        
        if (newPrice !== product.price) {
          updatedCount++;
          return { ...product, price: newPrice };
        }
      }
      return product;
    });

    // 3. Save to a new file
    await fs.writeFile(outputFile, JSON.stringify(updatedProducts, null, 2), 'utf-8');

    console.log(`Successfully updated prices for ${updatedCount} products.`);
    console.log(`New data saved to ${outputFile}`);

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

updatePrices();
