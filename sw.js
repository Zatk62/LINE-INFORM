const CACHE_NAME = 'sqe-mobile-v3';
const assets = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// ติดตั้ง Service Worker และ Cache ไฟล์
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// ดึงข้อมูลจาก Cache เมื่อออฟไลน์
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});