// Enhanced Service Worker for Argenta with advanced caching strategies
const CACHE_NAME = 'argenta-cache-v1.1';
const IMAGE_CACHE_NAME = 'argenta-images-v1.1';
const API_CACHE_NAME = 'argenta-api-v1.1';
const STATIC_CACHE_NAME = 'argenta-static-v1.1';

// Cache duration settings
const CACHE_DURATION = {
    IMAGES: 24 * 60 * 60 * 1000,    // 24 hours
    API: 60 * 60 * 1000,            // 1 hour
    STATIC: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Files to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/owl.carousel.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/assets/owl.carousel.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/assets/owl.theme.default.min.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Install event');
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activate event');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME && 
                        cache !== IMAGE_CACHE_NAME && 
                        cache !== API_CACHE_NAME && 
                        cache !== STATIC_CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - handle different resource types
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle different resource types
    if (url.hostname === 'allhub.progesio.my.id' && url.pathname.startsWith('/storage/')) {
        // Handle images from storage
        event.respondWith(handleImageRequest(request));
    } else if (url.hostname === 'allhub.progesio.my.id' && url.pathname.startsWith('/api/')) {
        // Handle API requests
        event.respondWith(handleAPIRequest(request));
    } else if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
        // Handle static assets
        event.respondWith(handleStaticRequest(request));
    } else {
        // Handle other requests
        event.respondWith(handleOtherRequest(request));
    }
});

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
    try {
        const cache = await caches.open(IMAGE_CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            const cacheTime = await getCacheTime(request, IMAGE_CACHE_NAME);
            if (cacheTime && (Date.now() - cacheTime < CACHE_DURATION.IMAGES)) {
                return cachedResponse;
            }
        }
        
        // Fetch from network
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Clone response before caching
            const responseClone = networkResponse.clone();
            await cache.put(request, responseClone);
            await setCacheTime(request, IMAGE_CACHE_NAME, Date.now());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Error handling image request:', error);
        // Return cached version if available, even if expired
        const cache = await caches.open(IMAGE_CACHE_NAME);
        const cachedResponse = await cache.match(request);
        return cachedResponse || new Response('Image not available', { status: 404 });
    }
}

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
    try {
        const cache = await caches.open(API_CACHE_NAME);
        
        // Try network first
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            await cache.put(request, responseClone);
            await setCacheTime(request, API_CACHE_NAME, Date.now());
            return networkResponse;
        }
        
        // If network fails, try cache
        const cachedResponse = await cache.match(request);
        return cachedResponse || new Response('API not available', { status: 503 });
        
    } catch (error) {
        console.error('Error handling API request:', error);
        // Return cached version if available
        const cache = await caches.open(API_CACHE_NAME);
        const cachedResponse = await cache.match(request);
        return cachedResponse || new Response('API not available', { status: 503 });
    }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
    try {
        const cache = await caches.open(STATIC_CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            const cacheTime = await getCacheTime(request, STATIC_CACHE_NAME);
            if (cacheTime && (Date.now() - cacheTime < CACHE_DURATION.STATIC)) {
                return cachedResponse;
            }
        }
        
        // Fetch from network
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            await cache.put(request, responseClone);
            await setCacheTime(request, STATIC_CACHE_NAME, Date.now());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Error handling static request:', error);
        // Return cached version if available
        const cache = await caches.open(STATIC_CACHE_NAME);
        const cachedResponse = await cache.match(request);
        return cachedResponse || fetch(request);
    }
}

// Handle other requests with network-first strategy
async function handleOtherRequest(request) {
    try {
        const networkResponse = await fetch(request);
        return networkResponse;
    } catch (error) {
        console.error('Error handling other request:', error);
        return new Response('Resource not available', { status: 503 });
    }
}

// Cache time management
async function setCacheTime(request, cacheName, timestamp) {
    const cache = await caches.open(cacheName + '-metadata');
    await cache.put(request.url, new Response(JSON.stringify({ timestamp })));
}

async function getCacheTime(request, cacheName) {
    try {
        const cache = await caches.open(cacheName + '-metadata');
        const response = await cache.match(request.url);
        if (response) {
            const data = await response.json();
            return data.timestamp;
        }
    } catch (error) {
        console.error('Error getting cache time:', error);
    }
    return null;
}

// Message handler for cache operations
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'CLEAR_IMAGE_CACHE':
            clearImageCache().then(() => {
                event.ports[0].postMessage({ success: true });
            }).catch(() => {
                event.ports[0].postMessage({ success: false });
            });
            break;
            
        case 'GET_CACHE_INFO':
            getCacheInfo().then((info) => {
                event.ports[0].postMessage(info);
            });
            break;
            
        case 'CLEAR_ALL_CACHE':
            clearAllCache().then(() => {
                event.ports[0].postMessage({ success: true });
            }).catch(() => {
                event.ports[0].postMessage({ success: false });
            });
            break;
    }
});

// Cache management functions
async function clearImageCache() {
    const cache = await caches.open(IMAGE_CACHE_NAME);
    const keys = await cache.keys();
    await Promise.all(keys.map(key => cache.delete(key)));
    
    // Also clear metadata
    const metadataCache = await caches.open(IMAGE_CACHE_NAME + '-metadata');
    const metadataKeys = await metadataCache.keys();
    await Promise.all(metadataKeys.map(key => metadataCache.delete(key)));
    
    console.log('Image cache cleared');
}

async function clearAllCache() {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('All caches cleared');
}

async function getCacheInfo() {
    try {
        const imageCache = await caches.open(IMAGE_CACHE_NAME);
        const apiCache = await caches.open(API_CACHE_NAME);
        const staticCache = await caches.open(STATIC_CACHE_NAME);
        
        const imageKeys = await imageCache.keys();
        const apiKeys = await apiCache.keys();
        const staticKeys = await staticCache.keys();
        
        return {
            imageCount: imageKeys.length,
            apiCount: apiKeys.length,
            staticCount: staticKeys.length,
            imageUrls: imageKeys.map(key => key.url),
            apiUrls: apiKeys.map(key => key.url),
            staticUrls: staticKeys.map(key => key.url)
        };
    } catch (error) {
        console.error('Error getting cache info:', error);
        return { imageCount: 0, apiCount: 0, staticCount: 0, imageUrls: [], apiUrls: [], staticUrls: [] };
    }
}

// Background sync for cache optimization
self.addEventListener('sync', (event) => {
    if (event.tag === 'cache-cleanup') {
        event.waitUntil(performCacheCleanup());
    }
});

async function performCacheCleanup() {
    const now = Date.now();
    
    // Clean expired image cache
    const imageCache = await caches.open(IMAGE_CACHE_NAME);
    const imageKeys = await imageCache.keys();
    
    for (const key of imageKeys) {
        const cacheTime = await getCacheTime(key, IMAGE_CACHE_NAME);
        if (cacheTime && (now - cacheTime > CACHE_DURATION.IMAGES)) {
            await imageCache.delete(key);
        }
    }
    
    console.log('Cache cleanup completed');
}
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
