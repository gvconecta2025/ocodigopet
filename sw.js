const CACHE_NAME = 'petlojas-revista-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 1. INSTALAÇÃO: Salva os arquivos fundamentais no celular
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('⚙️ [Service Worker] Fazendo cache da estrutura base (App Shell)');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  self.skipWaiting(); // Força a atualização imediata
});

// 2. ATIVAÇÃO: Limpa versões antigas do cache se você atualizar o app
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('🧹 [Service Worker] Limpando cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. FETCH: Intercepta a navegação
self.addEventListener('fetch', (event) => {
  // Ignora requisições do Firebase Firestore (os eventos de Pixel precisam ir direto para a rede)
  if (event.request.url.includes('firestore.googleapis.com')) {
    return;
  }

  // Estratégia "Cache First, fallback to Network" para a interface ser ultrarrápida
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
