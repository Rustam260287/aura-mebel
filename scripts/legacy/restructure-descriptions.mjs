
import fs from 'fs/promises';

const FINAL_PRODUCTS_FILE = 'all_products_final.json';

async function restructureDescriptions() {
  try {
    console.log(`Reading from ${FINAL_PRODUCTS_FILE}...`);
    const finalProductsContent = await fs.readFile(FINAL_PRODUCTS_FILE, 'utf-8');
    const products = JSON.parse(finalProductsContent);

    let restructuredCount = 0;
    const separator = 'Техническая информация:';

    const restructuredProducts = products.map(product => {
      if (!product.description) {
        product.description_main = '';
        product.description_specs = '';
        delete product.description;
        return product;
      }

      const separatorIndex = product.description.indexOf(separator);

      if (separatorIndex !== -1) {
        restructuredCount++;
        // Разделяем описание и характеристики
        product.description_main = product.description.substring(0, separatorIndex).trim();
        product.description_specs = product.description.substring(separatorIndex + separator.length).trim();
      } else {
        // Если разделителя нет, всё описание идет в main
        product.description_main = product.description.trim();
        product.description_specs = '';
      }
      
      // Удаляем старое поле description
      delete product.description;

      return product;
    });

    console.log(`Successfully restructured ${restructuredCount} products with separate specs.`);
    console.log(`Total products processed: ${restructuredProducts.length}.`);

    console.log(`Saving updated structure back to ${FINAL_PRODUCTS_FILE}...`);
    await fs.writeFile(FINAL_PRODUCTS_FILE, JSON.stringify(restructuredProducts, null, 2));

    console.log('File has been successfully updated.');

  } catch (error) {
    console.error('An error occurred during restructuring:', error);
  }
}

restructureDescriptions();
