import { offlineFallback, warmStrategyCache } from 'workbox-recipes';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { registerRoute, Route } from 'workbox-routing';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';


let cacheName = "capivarias";
let filesTochache = ["/", "/index.html", "/css/style.css", "/js/main.js", "/js/db.js"];

// configurando o cache
const pageCache = new CacheFirst({
  cacheName: 'capivara-cache',
  plugins: [
    new CacheableResponsePlugin({
      statuses: [0, 200],
    }),
    new ExpirationPlugin({
      maxAgeSeconds: 30 * 24 * 60 * 60,
    }),
  ],
});


self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(cacheName).then(function (cache){
      return cache.addAll(filesTochache);
    })
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) =>{
      return response || fetch(e.request);
    })
  )
})

//indicando o cache de página
warmStrategyCache({
  urls: ['/index.html', '/'],
  strategy: pageCache,
});
//registrando a rota
registerRoute(({ request }) => request.mode === 'navigate', pageCache);

// configurando cache de assets
registerRoute(
  ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
  new StaleWhileRevalidate({
    cacheName: 'asset-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
);

const imageRoute = new Route(({ request }) => {
  return request.destination === 'image';
}, new CacheFirst({
  cacheName: 'images',
  plugins: [
    new ExpirationPlugin({
      maxAgeSeconds: 60 * 60 * 24 * 30,
    })
  ]
}));

registerRoute(imageRoute);

