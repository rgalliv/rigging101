/* Rigging 101 Field Learning Lab — offline cache.
   Course shell files are network-first so returning learners receive safety
   corrections immediately. The cache remains the offline fallback. */
const CACHE = "rig101-v30";
const CORE = ["./", "index.html", "cq-design-tokens.css", "remediation.css", "visual-labs.css", "visual-labs.js", "rigging-tools.css", "rigging-core.js", "rigging-tools.js", "learning-lab.js", "learning-lab.css", "manifest.webmanifest", "assets/brand/cranequalified-dark-background.svg", "assets/brand/favicon.svg", "assets/reference/hitch-types-basic.jpg", "assets/reference/hitch-types-controlled-loads.jpg"];
CORE.push(...Array.from({length:10},(_,i)=>`assets/blender/spreader-${30+i*5}.webp`));
const SHELL_PATHS = new Set(CORE.map(item => new URL(item, self.location.href).pathname));

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(event.request);
      const networkFirst = event.request.mode === "navigate" || SHELL_PATHS.has(url.pathname);
      if (networkFirst) {
        try {
          const response = await fetch(event.request);
          if (response.ok) await cache.put(event.request, response.clone());
          return response;
        } catch {
          if (cached) return cached;
          if (event.request.mode === "navigate") return (await cache.match("index.html")) || Response.error();
          return Response.error();
        }
      }
      const network = fetch(event.request).then(response => {
        if (response.ok) cache.put(event.request, response.clone());
        return response;
      }).catch(() => cached || Response.error());
      return cached || network;
    })
  );
});
