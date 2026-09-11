self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>{e.waitUntil((async()=>{try{
const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)));
await self.registration.unregister();
const cs=await self.clients.matchAll({type:'window',includeUncontrolled:true});
for(const c of cs){try{c.navigate(c.url)}catch(_){}}}catch(_){}})())});
self.addEventListener('fetch',()=>{});
