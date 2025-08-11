// Simple Service Worker for NeuralHack Cognitive AI
// Minimal implementation to avoid production errors

const CACHE_NAME = 'neuralhack-v1';
const CACHE_VERSION = '1.0.0';

// Only cache essential files that we know exist
const ESSENTIAL_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('SW: Installing version', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Caching essential files');
        // Use addAll with error handling
        return Promise.allSettled(
          ESSENTIAL_CACHE.map(url => 
            fetch(url)
              .then(response => {
                if (response.ok) {
                  return cache.put(url, response);
                }
                console.warn('SW: Failed to fetch', url);
              })
              .catch(error => console.warn('SW: Error fetching', url, error))
          )
        );
      })
      .then(() => {
        console.log('SW: Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('SW: Installation failed', error);
        // Continue anyway
        return self.skipWaiting();
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('SW: Activating');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('SW: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('SW: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - simple network-first strategy
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Skip API calls to avoid caching issues
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If network request succeeds, cache it (for static assets only)
        if (response.ok && 
            (event.request.url.includes('/assets/') || 
             event.request.url.endsWith('.html') ||
             event.request.url.endsWith('.json'))) {
          
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone))
            .catch(error => console.warn('SW: Cache put failed', error));
        }
        return response;
      })
      .catch(error => {
        console.log('SW: Network failed, trying cache for', event.request.url);
        
        // If network fails, try cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // For navigation requests, return the cached index.html
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html')
                .then(indexResponse => {
                  if (indexResponse) {
                    return indexResponse;
                  }
                  // Fallback response
                  return new Response('App offline', { 
                    status: 503, 
                    statusText: 'Service Unavailable' 
                  });
                });
            }
            
            // For other requests, return a simple error
            return new Response('Resource unavailable offline', { 
              status: 503, 
              statusText: 'Service Unavailable' 
            });
          });
      })
  );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('SW: Simple Service Worker loaded');