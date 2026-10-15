// يُولَّد تلقائياً من build-pwa.py
const CACHE = 'branch-report-fc949b8e5a9d';
const FILES = ['./', "app/app-mode.js", "app/editor.css", "app/editor.js", "app/mobile.css", "app/mobile.js", "app/report-branch.js", "app/syria-map.js", "app/violations.js", "assets/dpd-shield.png", "assets/fonts/itfQomraArabic-Black.otf", "assets/fonts/itfQomraArabic-Bold.otf", "assets/fonts/itfQomraArabic-Light.otf", "assets/fonts/itfQomraArabic-Medium.otf", "assets/fonts/itfQomraArabic-Regular.otf", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "index.html", "manifest.webmanifest"];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request)));
});
