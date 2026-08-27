// sw.js - Service Worker para Notificaciones en Segundo Plano

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title || 'Nueva Notificación';

  // Configuración adaptada a Chromebook
  const options = {
    body: data.body || '',
    icon: data.icon || '/assets/icon.png',
    badge: data.badge || '/assets/badge.png',
    tag: data.tag || 'general-notification',
    renotify: true,
    data: {
      url: data.url || '/',
      type: data.type,
      callId: data.callId
    },
    // Mantener notificación activa en pantalla si es llamada entrante
    requireInteraction: data.type === 'call'
  };

  // Añadir botones interactivos si es una llamada
  if (data.type === 'call') {
    options.actions = [
      { action: 'open', title: '📞 Abrir para responder' }
    ];
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

// Manejar clic en la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si la página ya está abierta en una pestaña, la enfoca
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no está abierta, abre una nueva ventana
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
