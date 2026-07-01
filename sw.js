/* Our Family — service worker
   প্রতিবার নতুন ডিপ্লয়ে নিচের ভার্সন বাড়ান (v1 → v2 → ...) */
const CACHE_NAME = 'our-family-v15';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-256.png',
  './icon-384.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                 // POST ইত্যাদি স্পর্শ করব না
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;       // Firebase/CDN সরাসরি নেটওয়ার্কে যাক

  // অ্যাপ পেজ — network-first (আপডেট দ্রুত দেখাবে, অফলাইনে ক্যাশ)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // আইকন/ম্যানিফেস্ট ইত্যাদি — cache-first
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(req, copy));
      return res;
    }))
  );
});
