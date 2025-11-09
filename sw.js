// sw.js

const CACHE_NAME = 'aura-mebel-cache-v1';
// Этот список иллюстративен. В реальном процессе сборки он будет генерироваться автоматически.
const APP_SHELL_URLS = [
  './',
  './index.html',
  './index.tsx',
];

// Событие install: кэшируем оболочку приложения
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching app shell');
      return cache.addAll(APP_SHELL_URLS);
    })
  );
});

// Событие activate: очищаем старые кэши
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Событие fetch: применяем стратегию stale-while-revalidate
self.addEventListener('fetch', (event) => {
  // Позволяем браузеру обрабатывать запросы к CDN скриптам
  if (event.request.url.startsWith('https://aistudiocdn.com') || event.request.url.startsWith('https://cdn.tailwindcss.com')) {
    return;
  }
  
  // Для остальных запросов используем stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Если запрос успешен, обновляем кэш
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });

        // Немедленно возвращаем ответ из кэша, если он есть,
        // пока сетевой запрос выполняется в фоновом режиме.
        return cachedResponse || fetchPromise;
      });
    })
  );
});