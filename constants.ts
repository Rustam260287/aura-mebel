
import type { Product } from './types';

export const productData: Product[] = [
  {
    id: 1,
    name: "Минималистичный дубовый каркас кровати",
    category: "Спальня",
    price: 49990,
    imageUrls: [
        "https://picsum.photos/seed/scandinavian-bedroom/800/800",
        "https://picsum.photos/seed/oak-bed-closeup/800/800",
        "https://picsum.photos/seed/minimalist-bed-angle/800/800",
        "https://picsum.photos/seed/bright-bedroom-interior/800/800"
    ],
    description: "Прочный и элегантный каркас кровати из дуба с чистым, минималистичным дизайном. Идеально подходит для современных спален в скандинавском стиле.",
    seoDescription: "Создайте оазис спокойствия и уюта в вашей спальне с нашим минималистичным дубовым каркасом кровати. Эта модель — воплощение скандинавского дизайна, где каждая линия продумана для достижения гармонии и функциональности. Изготовленный из цельного массива дуба, этот каркас кровати не только выглядит невероятно стильно, но и гарантирует прочность и долговечность на долгие годы. Натуральная текстура дерева привносит в интерьер тепло и ощущение близости к природе, а надежное металлическое основание обеспечивает идеальную поддержку для вашего матраса. Если вы ищете, где купить кровать из дуба в Альметьевске, наша модель размером 160х200 см станет идеальным выбором для современной спальни. Этот каркас кровати из массива — не просто мебель, это инвестиция в ваш здоровый сон и эстетическое удовольствие. Подарите себе роскошь натуральных материалов и безупречного стиля.",
    rating: 4.8,
    reviews: [
        { author: 'Елена В.', rating: 5, comment: 'Потрясающее качество! Кровать выглядит еще лучше, чем на фото. Сборка простая.', date: '2023-05-15' },
        { author: 'Иван П.', rating: 4, comment: 'Хорошая, крепкая кровать. Единственное, доставка немного задержалась.', date: '2023-04-22' }
    ],
    details: {
        dimensions: '160см x 200см x 90см',
        material: 'Массив дуба, металлическое основание',
        care: 'Протирать сухой мягкой тканью. Избегать прямых солнечных лучей.'
    }
  },
  {
    id: 2,
    name: "Бархатное акцентное кресло",
    category: "Гостиная",
    price: 24990,
    originalPrice: 29990,
    imageUrls: [
        "https://picsum.photos/seed/green-velvet-chair/800/800",
        "https://picsum.photos/seed/velvet-chair-side/800/800",
        "https://picsum.photos/seed/velvet-texture-closeup/800/800",
        "https://picsum.photos/seed/living-room-accent-chair/800/800"
    ],
    description: "Плюшевое бархатное кресло, которое добавит яркий акцент и изысканность в любое жилое пространство. Доступно в нескольких насыщенных оттенках.",
    rating: 4.9,
    reviews: [
        { author: 'Анна К.', rating: 5, comment: 'Влюбилась в это кресло! Цвет насыщенный, ткань очень приятная на ощупь. Стало центром моей гостиной.', date: '2023-06-01' },
        { author: 'Сергей М.', rating: 5, comment: 'Очень удобное и стильное. Рекомендую.', date: '2023-05-18' }
    ],
    details: {
        dimensions: '80см x 75см x 85см',
        material: 'Бархат, ножки из массива бука',
        care: 'Рекомендуется сухая чистка.'
    }
  },
  {
    id: 3,
    name: "Кофейный столик с мраморной столешницей",
    category: "Гостиная",
    price: 34990,
    imageUrls: [
        "https://picsum.photos/seed/marble-coffee-table/800/800",
        "https://picsum.photos/seed/marble-table-top-view/800/800",
        "https://picsum.photos/seed/modern-living-room-table/800/800"
    ],
    description: "Роскошный кофейный столик с настоящей мраморной столешницей и гладким металлическим основанием. Настоящий центр притяжения вашей гостиной.",
    rating: 4.7,
    reviews: [
      { author: 'Ольга С.', rating: 5, comment: 'Столик просто шикарный! Мрамор настоящий, тяжелый. Выглядит очень дорого.', date: '2023-03-10' }
    ],
    details: {
        dimensions: 'Диаметр 80см, высота 45см',
        material: 'Натуральный мрамор, стальное основание',
        care: 'Использовать подставки под горячее. Протирать влажной тканью.'
    }
  },
  {
    id: 4,
    name: "Книжный шкаф в индустриальном стиле",
    category: "Офис",
    price: 39990,
    originalPrice: 45990,
    imageUrls: [
        "https://picsum.photos/seed/industrial-bookshelf/800/800",
        "https://picsum.photos/seed/books-on-wood-shelf/800/800",
        "https://picsum.photos/seed/loft-style-shelving/800/800"
    ],
    description: "Сочетайте стиль и функциональность с этим книжным шкафом в индустриальном стиле, изготовленным из переработанного дерева и черной стали.",
    rating: 4.6,
    reviews: [
      { author: 'Дмитрий Л.', rating: 5, comment: 'Отлично вписался в мой лофт. Качество на высоте.', date: '2023-02-25' },
      { author: 'Мария Г.', rating: 4, comment: 'Стильный, но собирать было не очень просто.', date: '2023-01-19' }
    ],
    details: {
        dimensions: '120см x 40см x 180см',
        material: 'Массив сосны, стальной каркас',
        care: 'Протирать пыль сухой тканью.'
    }
  },
  {
    id: 5,
    name: "Льняной комплект постельного белья",
    category: "Спальня",
    price: 15990,
    imageUrls: [
        "https://picsum.photos/seed/linen-bedding-set/800/800",
        "https://picsum.photos/seed/linen-fabric-texture/800/800",
        "https://picsum.photos/seed/cozy-unmade-bed/800/800"
    ],
    description: "Ощутите максимальный комфорт с нашим комплектом из 100% чистого льна. Дышащий, мягкий и элегантный без усилий.",
    rating: 5.0,
    reviews: [
      { author: 'Екатерина', rating: 5, comment: 'Лучшее постельное белье, которое у меня было. Невероятно приятное к телу.', date: '2023-06-05' }
    ],
    details: {
        dimensions: 'Евро-размер (пододеяльник 200х220, 2 наволочки 50х70)',
        material: '100% лён',
        care: 'Машинная стирка при 40 градусах. Не отбеливать.'
    }
  },
  {
    id: 6,
    name: "Раздвижной обеденный стол",
    category: "Столовая",
    price: 69990,
    imageUrls: [
        "https://picsum.photos/seed/walnut-dining-table/800/800",
        "https://picsum.photos/seed/large-dining-table-set/800/800",
        "https://picsum.photos/seed/wood-table-grain/800/800"
    ],
    description: "Принимайте гостей с комфортом благодаря этому универсальному и стильному раздвижному обеденному столу из массива ореха.",
    rating: 4.8,
    reviews: [
      { author: 'Семья Ивановых', rating: 5, comment: 'Идеальный стол для нашей большой семьи. Механизм работает плавно.', date: '2023-04-11' }
    ],
    details: {
        dimensions: '160-220см (длина) x 90см (ширина) x 75см (высота)',
        material: 'Массив ореха',
        care: 'Использовать скатерти и подставки. Протирать влажной тканью.'
    }
  },
  {
    id: 7,
    name: "Диван в стиле мид-сенчури",
    category: "Гостиная",
    price: 89990,
    originalPrice: 99990,
    imageUrls: [
        "https://picsum.photos/seed/mid-century-sofa-gray/800/800",
        "https://picsum.photos/seed/sofa-cushions-detail/800/800",
        "https://picsum.photos/seed/tapered-sofa-leg/800/800",
        "https://picsum.photos/seed/stylish-living-room-sofa/800/800"
    ],
    description: "Диван вне времени с классическими линиями середины века, обитый прочной и удобной тканью. Особенности — конические деревянные ножки.",
    rating: 4.9,
    reviews: [
      { author: 'Алексей', rating: 5, comment: 'Диван превзошел все ожидания. Очень стильный и удобный. Цвет ткани соответствует фото.', date: '2023-05-20' },
      { author: 'Виктория', rating: 5, comment: 'Отличное качество, быстрая доставка. Спасибо!', date: '2023-05-12' }
    ],
    details: {
        dimensions: '220см x 90см x 85см',
        material: 'Ткань рогожка, каркас из массива сосны, ножки из бука',
        care: 'Сухая чистка, съемные подушки можно стирать в деликатном режиме.'
    },
    isConfigurable: true,
    configurationOptions: [
      {
        id: 'fabric',
        name: 'Обивка',
        choices: [
          { name: 'Рогожка (стандарт)' },
          { name: 'Велюр' },
          { name: 'Эко-кожа' },
        ],
      },
      {
        id: 'color',
        name: 'Цвет',
        choices: [
          { name: 'Серый' },
          { name: 'Изумрудный' },
          { name: 'Терракотовый' },
          { name: 'Бежевый' },
        ],
      },
      {
        id: 'legs',
        name: 'Ножки',
        choices: [
          { name: 'Деревянные (Бук)' },
          { name: 'Металлические (Черные)' },
        ],
      },
    ],
  },
  {
    id: 8,
    name: "Эргономичное офисное кресло",
    category: "Офис",
    price: 29990,
    imageUrls: [
        "https://picsum.photos/seed/ergonomic-office-chair/800/800",
        "https://picsum.photos/seed/mesh-chair-back/800/800",
        "https://picsum.photos/seed/home-office-setup-chair/800/800"
    ],
    description: "Поддержите свой рабочий день с этим полностью регулируемым эргономичным офисным креслом, созданным для максимального комфорта и производительности.",
    rating: 4.7,
    reviews: [
      { author: 'Программист', rating: 5, comment: 'Спина сказала спасибо. Множество регулировок, отличное кресло для долгой работы.', date: '2023-03-30' }
    ],
    details: {
        dimensions: 'Регулируемая высота, ширина 65см',
        material: 'Сетчатая спинка, сиденье из ткани, пластиковая основа',
        care: 'Протирать влажной губкой.'
    }
  },
  {
    id: 9,
    name: "Обеденные стулья из бука (комплект из 2)",
    category: "Столовая",
    price: 18990,
    imageUrls: [
        "https://picsum.photos/seed/beech-dining-chairs/800/800",
        "https://picsum.photos/seed/pair-of-wooden-chairs/800/800",
        "https://picsum.photos/seed/dining-chairs-at-table/800/800"
    ],
    description: "Элегантные и прочные обеденные стулья из массива бука с мягким сиденьем. Идеальное дополнение к вашему обеденному столу.",
    rating: 4.5,
    reviews: [],
    details: {
        dimensions: '45см x 50см x 90см',
        material: 'Массив бука, сиденье из ткани',
        care: 'Протирать сухой тканью.'
    }
  },
  {
    id: 10,
    name: "Тумба под ТВ из мангового дерева",
    category: "Гостиная",
    price: 45990,
    originalPrice: 52990,
    imageUrls: [
        "https://picsum.photos/seed/mango-wood-tv-stand/800/800",
        "https://picsum.photos/seed/boho-tv-console/800/800",
        "https://picsum.photos/seed/living-room-media-unit/800/800"
    ],
    description: "Стильная и вместительная тумба под ТВ в стиле бохо, изготовленная из экологичного мангового дерева с резными элементами.",
    rating: 4.8,
    reviews: [
      { author: 'Ирина', rating: 5, comment: 'Очень красивая тумба, ручная работа чувствуется. Вместительная.', date: '2023-02-14' }
    ],
    details: {
        dimensions: '150см x 40см x 55см',
        material: 'Массив мангового дерева',
        care: 'Избегать попадания влаги.'
    }
  },
  {
    id: 11,
    name: "Кухонный остров на колесиках",
    category: "Кухня",
    price: 38990,
    imageUrls: [
        "https://picsum.photos/seed/rolling-kitchen-island/800/800",
        "https://picsum.photos/seed/butcher-block-top/800/800",
        "https://picsum.photos/seed/kitchen-cart-storage/800/800"
    ],
    description: "Мобильный и функциональный кухонный остров со столешницей из нержавеющей стали, полками для хранения и держателем для полотенец.",
    rating: 4.6,
    reviews: [],
    details: {
        dimensions: '100см x 60см x 90см',
        material: 'Массив сосны, столешница из нержавеющей стали',
        care: 'Столешницу протирать специальными средствами для стали.'
    }
  },
  {
    id: 12,
    name: "Барные стулья с кожаной обивкой (комплект из 2)",
    category: "Кухня",
    price: 22990,
    imageUrls: [
        "https://picsum.photos/seed/leather-bar-stools/800/800",
        "https://picsum.photos/seed/kitchen-counter-stools/800/800",
        "https://picsum.photos/seed/brown-leather-seat/800/800"
    ],
    description: "Современные барные стулья с удобным сиденьем из искусственной кожи и прочным металлическим каркасом. Регулируются по высоте.",
    rating: 4.7,
    reviews: [
      { author: 'Максим', rating: 5, comment: 'Удобные, стильные. Легко собираются. Регулировка высоты работает отлично.', date: '2023-01-28' }
    ],
    details: {
        dimensions: 'Регулируемая высота сиденья 60-80см',
        material: 'Эко-кожа, стальной каркас',
        care: 'Протирать влажной губкой.'
    }
  },
  {
    id: 13,
    name: "Скамья для прихожей с полкой для обуви",
    category: "Прихожая",
    price: 17990,
    imageUrls: [
        "https://picsum.photos/seed/hallway-bench-shoes/800/800",
        "https://picsum.photos/seed/entryway-furniture-bench/800/800",
        "https://picsum.photos/seed/wood-shoe-bench/800/800"
    ],
    description: "Элегантная и практичная скамья для прихожей. Поможет навести порядок и добавит уюта вашему входу. Мягкое сиденье и прочная полка для обуви.",
    rating: 4.8,
    reviews: [],
    details: {
        dimensions: '100см x 35см x 45см',
        material: 'Массив ясеня, сиденье из рогожки',
        care: 'Протирать сухой тканью.'
    }
  },
  {
    id: 14,
    name: "Детская кровать-домик",
    category: "Детская",
    price: 28990,
    imageUrls: [
        "https://picsum.photos/seed/kids-house-bed/800/800",
        "https://picsum.photos/seed/montessori-bed-kids-room/800/800",
        "https://picsum.photos/seed/childrens-bedroom-decor/800/800"
    ],
    description: "Создайте волшебную атмосферу в детской комнате с этой кроватью-домиком. Изготовлена из натуральной сосны, безопасна и очень нравится детям.",
    rating: 4.9,
    reviews: [
        { author: 'Мама Аня', rating: 5, comment: 'Ребенок в восторге! Теперь укладывается спать с удовольствием. Качество отличное.', date: '2023-07-01' }
    ],
    details: {
        dimensions: '168см x 88см x 150см (под матрас 160х80)',
        material: 'Массив сосны',
        care: 'Протирать влажной гипоаллергенной салфеткой.'
    }
  },
  {
    id: 15,
    name: "Комод из массива сосны",
    category: "Хранение",
    price: 33990,
    imageUrls: [
        "https://picsum.photos/seed/pine-dresser-storage/800/800",
        "https://picsum.photos/seed/wooden-chest-of-drawers/800/800",
        "https://picsum.photos/seed/bedroom-storage-furniture/800/800"
    ],
    description: "Вместительный и надежный комод с четырьмя ящиками. Натуральная текстура дерева привнесет тепло в любой интерьер. Идеально для спальни или гостиной.",
    rating: 4.7,
    reviews: [],
    details: {
        dimensions: '90см x 45см x 100см',
        material: 'Массив сосны, металлическая фурнитура',
        care: 'Протирать сухой тканью.'
    }
  }
];