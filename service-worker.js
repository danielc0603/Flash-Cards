
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('flashcard-cache').then(function(cache) {
      return cache.addAll([
        '/',
        '/index.html',
        '/styles-v2.css',
        '/script-v2.js'
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
