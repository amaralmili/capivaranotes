import { offlineFallback, warmStrategyCache } from 'workbox-recipes';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { registerRoute, Route } from 'workbox-routing';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';



// configurando o cache
const pageCache = new CacheFirst({//Ele da prioridade ao cache antes de solicitar algo
  cacheName: 'capivara-cache',
  plugins: [
    new CacheableResponsePlugin({
      statuses: [0, 200],//configura para armazenar em cache as respostas com codigo 0
    }),                  //sendo a 0 a falha e a 200 a bem-sucedida 
    
    new ExpirationPlugin({
      maxAgeSeconds: 30 * 24 * 60 * 60,//periodo de expiração para itens armazenados
    }),
  ],
});

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

// configurando offline fallback
offlineFallback({
  pageFallback: '/offline.html',
});

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