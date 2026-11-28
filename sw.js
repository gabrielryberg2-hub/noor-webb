const CACHE = 'noor-web-v10-reading-calendar';
const UI = [
  "./",
  "./styles.css",
  "./styles.css?v=10",
  "./app.mjs",
  "./app.mjs?v=10",
  "./noor10-extra.css",
  "./web-reading-calendar.mjs",
  "./web-duas-data.mjs",
  "./web-calendar-data.mjs",
  "./en/index.html",
  "./solar.mjs",
  "./manifest.webmanifest",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./integritet.html",
  "./web-guide.mjs",
  "./web-prayerJournal.mjs",
  "./web-premium.mjs",
  "./web-seasonal.mjs",
  "./web-ui.mjs",
  "./web-alarms.mjs",
  "./audio/adhan.mp3",
  "./audio/ADHAN-LICENS.txt",
  "./web-upgrade.mjs",
  "./web-qibla.mjs",
  "./guide-images/feet.png",
  "./guide-images/head.png",
  "./guide-images/qunut.png",
  "./guide-images/ruku.png",
  "./guide-images/sit.png",
  "./guide-images/stand.png",
  "./guide-images/sujud.png",
  "./guide-images/takbir.png",
  "./guide-images/washface.png",
  "./guide-images/washleft.png",
  "./guide-images/washright.png"
];
const base = self.registration.scope;
self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE).then(c => c.addAll(UI.map(x =>
    new Request(new URL(x, base), {cache:'reload'})
  ))).then(() => self.skipWaiting())
));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k =>
    k.startsWith('noor-web-') && k !== CACHE
  ).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
 const r=e.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==self.location.origin||u.pathname.endsWith('.apk')||u.pathname.endsWith('/download-config.json'))return;
 if(r.mode==='navigate'){
   e.respondWith((async()=>{
     try { return await fetch(r,{cache:'no-cache'}); }
     catch(error){
       const c=await caches.open(CACHE);
       let cached=await c.match(r);
       if(u.pathname===new URL('./',base).pathname||u.pathname===new URL('./index.html',base).pathname){
         cached=await c.match(new URL('./',base).href);
       }
       if(u.pathname===new URL('./integritet',base).pathname){
         cached=await c.match(new URL('./integritet.html',base).href);
       }
       if(!cached)throw error;
       if(cached.redirected)return new Response(cached.body,{status:cached.status,statusText:cached.statusText,headers:cached.headers});
       return cached;
     }
   })());return;
 }
 if (u.pathname.endsWith('/styles.css')) {
   e.respondWith((async()=>{const c=await caches.open(CACHE);try{const fresh=await fetch(r,{cache:'no-cache'});if(fresh.ok)await c.put(r,fresh.clone());return fresh;}catch(error){const cached=await c.match(r)||await c.match(new URL('./styles.css?v=10',base));if(cached)return cached;throw error;}})());return;
 }
 e.respondWith(caches.open(CACHE).then(async c=>{const cached=await c.match(r);if(cached){const range=r.headers.get('range');if(range&&u.pathname.endsWith('/audio/adhan.mp3')){const bytes=await cached.arrayBuffer(),m=/^bytes=(\d*)-(\d*)$/.exec(range);if(!m||(!m[1]&&!m[2]))return new Response(null,{status:416,headers:{'Content-Range':`bytes */${bytes.byteLength}`}});const start=m[1]?Number(m[1]):Math.max(0,bytes.byteLength-Number(m[2])),end=m[1]&&m[2]?Math.min(Number(m[2]),bytes.byteLength-1):bytes.byteLength-1;if(start>end||start>=bytes.byteLength)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${bytes.byteLength}`}});return new Response(bytes.slice(start,end+1),{status:206,headers:{'Content-Type':'audio/mpeg','Content-Range':`bytes ${start}-${end}/${bytes.byteLength}`,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes'}});}return cached;}return fetch(r);}));});
