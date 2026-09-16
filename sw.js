const PPL_DOWNLOAD_CACHE='ppl-download-v21';

self.addEventListener('install',event=>{
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    try{
      const keys=await caches.keys();
      await Promise.all(keys.filter(k=>k!==PPL_DOWNLOAD_CACHE).map(k=>caches.delete(k)));
      await self.clients.claim();
    }catch(_){}
  })());
});

self.addEventListener('message',event=>{
  const data=event.data||{};
  if(data.type!=='PPL_PREPARE_DOWNLOAD') return;

  event.waitUntil((async()=>{
    try{
      const cache=await caches.open(PPL_DOWNLOAD_CACHE);
      const key=new Request(new URL(`./__ppl_payload__/${encodeURIComponent(data.id)}`,self.registration.scope).href);
      const response=new Response("\ufeff"+String(data.content||''),{
        status:200,
        headers:{
          'Content-Type':'text/html; charset=utf-8',
          'Cache-Control':'no-store'
        }
      });
      await cache.put(key,response);
      if(event.ports&&event.ports[0]) event.ports[0].postMessage({ok:true});
    }catch(err){
      if(event.ports&&event.ports[0]) event.ports[0].postMessage({ok:false});
    }
  })());
});

self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  const marker='/__ppl_download__/';
  const pos=url.pathname.indexOf(marker);
  if(pos<0) return;

  event.respondWith((async()=>{
    try{
      const rest=url.pathname.slice(pos+marker.length);
      const parts=rest.split('/');
      const id=decodeURIComponent(parts[0]||'');
      const filename=decodeURIComponent(parts.slice(1).join('/')||'public_service_profile_result.html')
        .replace(/[^A-Za-z0-9._-]/g,'_');

      const cache=await caches.open(PPL_DOWNLOAD_CACHE);
      const key=new Request(new URL(`./__ppl_payload__/${encodeURIComponent(id)}`,self.registration.scope).href);
      const stored=await cache.match(key);

      if(!stored){
        return new Response('Download file not found.',{
          status:404,
          headers:{'Content-Type':'text/plain; charset=utf-8'}
        });
      }

      const body=await stored.arrayBuffer();
      event.waitUntil(cache.delete(key));

      return new Response(body,{
        status:200,
        headers:{
          'Content-Type':'application/octet-stream',
          'Content-Disposition':`attachment; filename="${filename}"`,
          'Cache-Control':'no-store, max-age=0',
          'Pragma':'no-cache',
          'Expires':'0',
          'X-Content-Type-Options':'nosniff'
        }
      });
    }catch(_){
      return new Response('Download failed.',{
        status:500,
        headers:{'Content-Type':'text/plain; charset=utf-8'}
      });
    }
  })());
});
