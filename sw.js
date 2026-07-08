const CACHE_NAME = 'sqe-mobile-v4.3'; // เปลี่ยนเลขเวอร์ชันที่นี่ (เช่น v4.1, v4.2) เมื่อมีการแก้ไขโค้ดครั้งถัดไป
const assets = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// 1. ติดตั้ง Service Worker และเก็บไฟล์ลง Cache
self.addEventListener('install', e => {
  console.log('SW: Installing and Caching Assets...');
  self.skipWaiting(); // บังคับให้ Service Worker ตัวใหม่ทำงานทันที ไม่ต้องรอปิดแอปก่อน
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// 2. ขั้นตอน Activate: ลบ Cache เก่าที่ชื่อไม่ตรงกับ CACHE_NAME ทิ้ง
// ขั้นตอนนี้สำคัญที่สุดในการทำให้แอปบนมือถือยอมรับค่าใหม่จากไฟล์ที่คุณเพิ่งแก้
self.addEventListener('activate', e => {
  console.log('SW: Activating and Clearing Old Caches...');
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('SW: Deleting Old Cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// 3. ดึงข้อมูลจาก Cache เมื่อออฟไลน์ (หรือถ้ามีในแคชให้ดึงมาเลย)
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      // ถ้าเจอใน Cache ให้คืนค่าจาก Cache, ถ้าไม่เจอให้ไปโหลดจาก Network
      return response || fetch(e.request);
    })
  );
});