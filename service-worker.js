// 广东省考学习工作台 - Service Worker
const CACHE_NAME = 'gongkao-workbench-v1';
const ASSETS = [
  'index.html',
  'gongkao-workbench.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
];

// 安装：缓存核心资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(()=>{})
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// 抓取：离线优先
self.addEventListener('fetch', event => {
  // 只处理同源 GET 请求
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return; // 跨域请求不拦截（时政抓取需要）

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(resp => {
        // 缓存新资源
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone)).catch(()=>{});
        }
        return resp;
      }).catch(() => caches.match('gongkao-workbench.html'));
    })
  );
});
