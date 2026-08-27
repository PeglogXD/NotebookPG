// sw.js
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Notificación';
  
  const options = {
    body: data.body || '',
    icon: '/icon.png',
    badge: '/badge.png',
    data: { url: data.url || '/' },
    tag: data.tag || 'general-notification',
    renotify: true,
    requireInteraction: data.type === 'call' // Mantiene la alerta en Chromebook si es llamada
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(event.notification.data.url);
    })
  );
});
