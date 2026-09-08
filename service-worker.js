/* ============================================================
   Service Worker — CD34+ Calculadora
   Guarda os arquivos do app em cache para que ele funcione
   mesmo sem internet, depois da primeira visita.
   ============================================================ */

const CACHE_NAME = 'cd34-calculadora-v1';

// Lista de arquivos que compõem o "esqueleto" do app.
const ARQUIVOS_PARA_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Quando o service worker é instalado, salva os arquivos no cache.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARQUIVOS_PARA_CACHE))
  );
  self.skipWaiting();
});

// Remove caches antigos quando uma nova versão do service worker assume.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(
        nomes
          .filter((nome) => nome !== CACHE_NAME)
          .map((nome) => caches.delete(nome))
      )
    )
  );
  self.clients.claim();
});

// Ao pedir um arquivo, tenta primeiro o cache; se não encontrar, busca na rede.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((respostaCache) => {
      return respostaCache || fetch(event.request);
    })
  );
});
