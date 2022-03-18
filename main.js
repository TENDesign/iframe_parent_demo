document.addEventListener('DOMContentLoaded', () => {

    const getTokenButton = document.getElementById('getTokenButton');
    const storeTokenButton = document.getElementById('storeTokenButton');
    const getTokenResponse = document.getElementById('getTokenResponse');
    const storeTokenResponse = document.getElementById('storeTokenResponse');
    const getIframe = document.createElement('iframe');
    const storeIframe = document.createElement('iframe');

    // const targetOrigin = 'https://gallant-yalow-dc416b.netlify.app'
    const targetOrigin = 'https://dpp-uat-sso.raimktg.com'

    getTokenButton.addEventListener('click', handleGetClick, false);
    storeTokenButton.addEventListener('click', handleStoreClick, false);

    window.addEventListener('message', async (event) => {
        if (event.origin !== targetOrigin) return;
        const { i_t, r_t, exp } = event.data.payload;
        switch(event.data.action) {
            case 'GET_TOKENS_RESPONSE': {
                if (i_t, r_t, exp) {
                    const putTokenReq = await putSSOTokens({i_t, r_t, exp});
                    if (putTokenReq) {
                        getTokenResponse.innerText = `
                            tokens retrieved from remote and stored to indexedDB
                            i_t: ${i_t}
                            r_t: ${r_t}
                            exp: ${exp}
                        `;
                        getIframe.remove();
                    }
                } else {
                    getTokenResponse.innerText = `no tokens returned`;
                    getIframe.remove();
                }
                return;
            }
            case 'STORE_TOKENS_RESPONSE': {
                if (i_t, r_t, exp) {
                    const putTokenReq = await putSSOTokens({i_t, r_t, exp});
                    if (putTokenReq) {
                        storeTokenResponse.innerText = `
                            tokens stored to remote and stored to indexedDB
                            i_t: ${i_t}
                            r_t: ${r_t}
                            exp: ${exp}
                        `;
                        storeIframe.remove();
                    }
                } else {
                    storeTokenResponse.innerText = `error: no tokens stored`;
                    storeIframe.remove();
                }
                return;
            }
        }
    });

    async function handleGetClick() {
        getTokenResponse.innerText = 'Getting token...'
        getIframe.setAttribute('id', 'centralized_cookie_repo_iframe');
        getIframe.referrerPolicy = 'strict-origin-when-cross-origin';
        getTokenResponse.parentElement.append(getIframe);
        getIframe.src = `${targetOrigin}/#/headlessTokens`;
        getIframe.onload = () => {
            getTokenResponse.innerText = 'iframe loaded...'
            setTimeout(() => {
                getIframe.contentWindow.postMessage({
                    action: 'GET_TOKENS',
                    payload: {
                        env: 'uat',
                        brand: 'poc'
                    }
                }, targetOrigin);
            }, 1000);
        };
    }

    async function handleStoreClick() {
        const i_t = btoa(`i_t.test${new Date().getTime()}`);
        const r_t = btoa(`r_t.test${new Date().getTime()}`);
        const exp = btoa(`exp.test${new Date().getTime()}`);
        putSSOTokens({i_t, r_t, exp});

        storeTokenResponse.innerText = 'Storing token...'
        storeIframe.setAttribute('id', 'centralized_cookie_repo_iframe');
        storeIframe.referrerPolicy = 'strict-origin-when-cross-origin';
        storeTokenResponse.parentElement.append(storeIframe);
        storeIframe.src = targetOrigin;
        storeIframe.onload = () => {
            storeTokenResponse.innerText = 'iframe loaded...'
            setTimeout(() => {
                storeIframe.contentWindow.postMessage({
                    action: 'STORE_TOKENS', 
                    payload: {
                        i_t, 
                        r_t, 
                        exp
                    }
                }, targetOrigin);
            }, 1000);
        };
    }

    async function putSSOTokens(ssoToken) {
        const databaseName = 'BATSSOTokens';
        const databaseStore = 'BATSSOTokens';
        return new Promise((resolve, reject) => {
            const dbrequest = indexedDB.open(databaseName, 1);
            dbrequest.onupgradeneeded = () => {
                const database = dbrequest.result;
                database.createObjectStore(databaseStore, { autoIncrement: true });
                database.onerror = (event) =>
                    reject(`ERROR:  ${dbrequest.error.code}`);
            };
            dbrequest.onerror = (event) =>
                reject(`ERROR:  ${dbrequest.error.code}`);
            dbrequest.onsuccess = (event) => {
                const database = dbrequest.result;
                const transaction = database.transaction(
                    databaseStore,
                    'readwrite'
                );
                const store = transaction.objectStore(databaseStore);
                const request = store.put(ssoToken, 1);
                request.onsuccess = () => resolve(ssoToken);
                transaction.oncomplete = () => database.close();
                database.onerror = () => reject(`ERROR:  ${dbrequest.error.code}`);
            };
        });
    }

});