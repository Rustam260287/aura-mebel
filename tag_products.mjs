import { getAdminDb } from './lib/firebaseAdmin.ts';

const normalize = (arr = []) =>
  Array.from(new Set(arr.filter(Boolean).map((t) => String(t).trim().toLowerCase()))).sort();

const detectTags = (data) => {
  const text = `${data.name || ''} ${data.description || data.description_main || ''}`.toLowerCase();

  const form = new Set([
    ...(Array.isArray(data.formTags) ? data.formTags : []),
  ]);
  const style = new Set([
    ...(Array.isArray(data.styleTags) ? data.styleTags : []),
  ]);
  const material = new Set([
    ...(Array.isArray(data.materialTags) ? data.materialTags : []),
  ]);
  const color = new Set([
    ...(Array.isArray(data.colorTags) ? data.colorTags : []),
  ]);

  const add = (set, condition, tag) => condition && set.add(tag);

  // Форма / тип
  add(form, /углов/.test(text), 'угловой');
  add(form, /модул/.test(text), 'модульный');
  add(form, /прям\w*/.test(text), 'прямой');
  add(form, /скругл|круг|овал/.test(text), 'округлый');
  add(form, /пуф|банкет/.test(text), 'пуф/банкетка');

  // Стиль
  add(style, /ар[\s-]?дек/.test(text), 'ар-деко');
  add(style, /неокласс/.test(text), 'неоклассика');
  add(style, /лофт/.test(text), 'лофт');
  add(style, /минимал|minimal/.test(text), 'минимализм');
  add(style, /сканди/.test(text), 'скандинавский');
  add(style, /классик/.test(text), 'классика');

  // Материалы/фактуры
  add(material, /велюр|бархат|velvet/.test(text), 'велюр/бархат');
  add(material, /букле/.test(text), 'букле');
  add(material, /кожа|эко[-\s]?кожа|leather/.test(text), 'кожа');
  add(material, /лен|l[iy]nen/.test(text), 'лён');
  add(material, /шерсть|wool/.test(text), 'шерсть');
  add(material, /замш|suede/.test(text), 'замша');
  add(material, /мрамор/.test(text), 'мрамор');
  add(material, /стекло/.test(text), 'стекло');
  add(material, /дерев|массив|ясен|дуб|орех/.test(text), 'дерево');
  add(material, /металл|сталь/.test(text), 'металл');
  add(material, /латун|бронз|золот/.test(text), 'латунь/золото');

  // Детали можно относить к материалам/стилю
  add(style, /капитон|стеж/.test(text), 'капитоне/стёжка');
  add(style, /кант/.test(text), 'кант');
  add(style, /пугов/.test(text), 'пуговицы');

  // Цвета
  add(color, /беж|молоч|крем|ivory|latte/.test(text), 'беж/молочный');
  add(color, /бел/.test(text), 'белый');
  add(color, /сер/.test(text), 'серый');
  add(color, /черн|black/.test(text), 'чёрный');
  add(color, /корич|шокол|coffee/.test(text), 'коричневый');
  add(color, /террак|кирпич|rust/.test(text), 'терракота');
  add(color, /зел/.test(text), 'зелёный');
  add(color, /син|бирюз|голуб/.test(text), 'синий/бирюза');
  add(color, /бордо|винн/.test(text), 'бордо/винный');

  const formTags = normalize([...form]);
  const styleTags = normalize([...style]);
  const materialTags = normalize([...material]);
  const colorTags = normalize([...color]);
  const tags = normalize([...formTags, ...styleTags, ...materialTags, ...colorTags, ...(Array.isArray(data.tags) ? data.tags : [])]);

  return { tags, formTags, styleTags, materialTags, colorTags };
};

async function main() {
  const db = getAdminDb();
  const snapshot = await db.collection('products').get();
  console.log(`Fetched ${snapshot.size} products. Generating tags...`);

  let processed = 0;
  let updated = 0;
  let batch = db.batch();
  let ops = 0;

  for (const doc of snapshot.docs) {
    processed += 1;
    const data = doc.data();
    const { tags, formTags, styleTags, materialTags, colorTags } = detectTags(data);

    const existingTags = normalize(data.tags || []);
    const existingForm = normalize(data.formTags || []);
    const existingStyle = normalize(data.styleTags || []);
    const existingMaterial = normalize(data.materialTags || []);
    const existingColor = normalize(data.colorTags || []);

    const mergeNeeded =
      JSON.stringify(existingTags) !== JSON.stringify(tags) ||
      JSON.stringify(existingForm) !== JSON.stringify(formTags) ||
      JSON.stringify(existingStyle) !== JSON.stringify(styleTags) ||
      JSON.stringify(existingMaterial) !== JSON.stringify(materialTags) ||
      JSON.stringify(existingColor) !== JSON.stringify(colorTags);

    if (mergeNeeded) {
      batch.update(doc.ref, { tags, formTags, styleTags, materialTags, colorTags });
      updated += 1;
      ops += 1;
    }

    if (ops >= 400) {
      await batch.commit();
      console.log(`Committed batch, updated ${updated} so far...`);
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  console.log(`Done. Processed: ${processed}, updated: ${updated}.`);
}

main().catch((err) => {
  console.error('Tagging error:', err);
  process.exit(1);
});
