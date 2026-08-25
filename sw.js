const CACHE_NAME = 'wasapedro-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json'
];

// 1. Instalación e inicialización del caché básico
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// 2. Activación y toma de control de los clientes inmediatos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Estrategia Network-First con fallback a Caché (requerido para instalabilidad PWA)
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Si la respuesta es válida, actualizamos la caché dinámicamente
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});

// 4. Manejo de Web Push Notifications si se envían desde un servidor
self.addEventListener('push', (event) => {
    let data = { title: 'WasaPedro', body: 'Nueva notificación recibida' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || 'https://cdn-icons-png.flaticon.com/512/2921/2921222.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/2921/2921222.png',
        vibrate: [200, 100, 200],
        data: data.url || './'
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// 5. Click en la notificación nativa (enfoca la app abierta o abre una nueva pestaña)
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data || './';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Si WasaPedro ya está abierto en alguna pestaña/ventana de ChromeOS, le da foco
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Si la PWA está cerrada, abre una ventana nueva
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
