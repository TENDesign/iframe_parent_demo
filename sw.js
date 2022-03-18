self.addEventListener('install', (event) => {
    self.skipWaiting()
        .then(() => console.log('Service Worker installed.'))
        .catch((err) => console.log(err));
});

self.addEventListener('activate', async (event) => {
    console.log(`Service worker activated.`);
});

async function handleNavigationRequest(event) {

    let request = event.request;

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