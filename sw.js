self.addEventListener('install', (event) => {
    self.skipWaiting()
        .then(() => console.log('Service Worker installed.'))
        .catch((err) => console.log(err));

    if (SITE_TYPE === SiteType.PWA) {
        event.waitUntil(
            caches.open(CACHE_NAME).then(cache => {
                return cache.addAll(CACHE_FILES);
            })
        );
    }
});

self.addEventListener('activate', async (event) => {
    console.log(`Service worker activated.`);
    event.waitUntil(self.clients.claim());
    event.waitUntil(postMessageToClient({ serviceWorkerActivated: true }));
    // Remove old caches
    if (SITE_TYPE === SiteType.PWA) {
        const keys = await caches.keys();
        return keys.map(async (cache) => {
            if (cache !== CACHE_NAME) {
                console.log(`Service Worker: Removing old cache: ${cache}`);
                return await caches.delete(cache);
            }
        });
    }
});

async function handleNavigationRequest(event) {

    const request = event.request;

    request = new Request(request, {
        headers: {
            ...request.headers,
            refreshtoken: btoa(`refreshToken${new Date().getTime()}`),
            accesstoken: btoa(`accessToken${new Date().getTime()}`)
        }
    });

    return fetch(request);

}

self.addEventListener('fetch', async (event) => {
    if (event.request.method === 'GET' && event.request.mode === 'navigate') {
        const startIndexSearchTerm = '://';
        const startIndex = event.request.url.indexOf(startIndexSearchTerm) + startIndexSearchTerm.length;
        const path = event.request.url.substring(event.request.url.indexOf('/', startIndex));

        if (!path.startsWith('/redirect')) event.respondWith(handleNavigationRequest(event));
    }
});