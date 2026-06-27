// sw.js — Service Worker de Chipas Premium
// Se encarga de mostrar la notificación del sistema operativo cuando llega
// un push, incluso si la página/app está cerrada.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Chipas Premium', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Chipas Premium';
  const options = {
    body: data.body || '',
    tag: data.tag || 'chipas-push',
    renotify: true,
    requireInteraction: false,
    icon: '/icon-512.png',
    badge: '/badge-96.png',
    data: data  // <-- pasar el payload completo para usarlo en notificationclick
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Al tocar la notificación, abre (o enfoca) la página correcta.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Leer la URL destino del payload, o inferirla del tag
  const data = event.notification.data || {};
  let targetUrl = data.url || '/';

  // Si no vino url en data, inferir por tag
  if (!data.url) {
    const tag = event.notification.tag || '';
    if (tag.includes('admin') || tag.includes('new-order') || tag.includes('pedido')) {
      targetUrl = '/?admin';
    }
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      // Priorizar una ventana admin ya abierta
      for (const client of clientsArr) {
        if (client.url.includes('?admin') || client.url.includes('&admin')) {
          return client.focus();
        }
      }
      // Si no hay ventana admin abierta, abrir la URL correcta
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
