/* Offline UI cache. Intentional: does not cache missing APKs. */
const CACHE='noor-web-v1.0.0';
const UI=['./','./index.html','./styles.css','./app.mjs','./solar.mjs','./manifest.webmanifest','./icons/icon-180.png','./icons/icon-192.png','./icons/icon-512.png','./integritet.html'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(UI)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 const path=new URL(event.request.url).pathname;
 if(path.endsWith('.apk'))return;
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(resp=>{if(resp.ok&&resp.type==='basic'){const c=resp.clone();caches.open(CACHE).then(cache=>cache.put(event.request,c));}return resp;})));
});
