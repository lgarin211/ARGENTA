const CACHE_NAME = 'argenta-images-v1';
const IMAGE_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 jam

// Install service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  self.skipWaiting();
});

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - intercept network requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only cache images from allhub.progesio.my.id/storage/
  if (url.hostname === 'allhub.progesio.my.id' && 
      url.pathname.startsWith('/storage/') &&
      (url.pathname.includes('.jpg') || url.pathname.includes('.jpeg') || 
       url.pathname.includes('.png') || url.pathname.includes('.gif') || 
       url.pathname.includes('.webp'))) {
    
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          
          // Check if cached response exists and is still fresh
          if (cachedResponse) {
            const cachedDate = new Date(cachedResponse.headers.get('cached-date'));
            const now = new Date();
            
            if (now - cachedDate < IMAGE_CACHE_EXPIRY) {
              console.log('Service Worker: Serving from cache:', event.request.url);
              return cachedResponse;
            } else {
              console.log('Service Worker: Cache expired, deleting:', event.request.url);
              cache.delete(event.request);
            }
          }
          
          // Fetch from network and cache
          return fetch(event.request).then((response) => {
            // Check if response is valid
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone response for caching
            const responseToCache = response.clone();
            
            // Add cache date header
            const responseWithDate = new Response(responseToCache.body, {
              status: responseToCache.status,
              statusText: responseToCache.statusText,
              headers: {
                ...Object.fromEntries(responseToCache.headers.entries()),
                'cached-date': new Date().toISOString()
              }
            });
            
            // Cache the response
            cache.put(event.request, responseWithDate.clone());
            console.log('Service Worker: Cached new image:', event.request.url);
            
            return response;
          }).catch((error) => {
            console.error('Service Worker: Fetch failed:', error);
            // Return cached version if available, even if expired
            return cachedResponse || new Response('Image not available', { status: 404 });
          });
        });
      })
    );
  }
  
  // For non-image requests, just fetch normally
  return;
});

// Handle cache cleanup
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_IMAGE_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log('Service Worker: Image cache cleared');
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data && event.data.type === 'GET_CACHE_INFO') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.keys().then((requests) => {
          const cacheInfo = {
            itemCount: requests.length,
            urls: requests.map(req => req.url)
          };
          event.ports[0].postMessage(cacheInfo);
        });
      })
    );
  }
});
