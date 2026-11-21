// Service worker tối giản: chỉ lưu "vỏ" app (index, icon, manifest).
// Dữ liệu thật vẫn lấy trực tiếp từ Google Apps Script, không bị cache.
const CACHE = 'anhduong-v1';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Không đụng vào Google / bên ngoài, để app chạy bình thường
  if (url.origin !== location.origin) return;

  // Ưu tiên mạng, mất mạng thì dùng bản đã lưu
  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
