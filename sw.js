/* Rigging 101 Field Learning Lab — offline cache.
   Course shell files are network-first so returning learners receive safety
   corrections immediately. The cache remains the offline fallback. */
const CACHE = "rig101-v33";
const CORE = ["./","index.html","course-data.js","course-runtime.js","skill-data.js","skill-workbench.js","skill-workbench.css","cq-design-tokens.css","remediation.css","learner-layout.css","visual-labs.css","visual-labs.js","rigging-tools.css","rigging-core.js","rigging-tools.js","manifest.webmanifest","assets/brand/cranequalified-dark-background.svg","assets/brand/favicon.svg","assets/reference/hitch-types-basic.jpg","assets/reference/hitch-types-controlled-loads.jpg","assets/brand/colorado-crane-operator-school.webp","assets/brand/cranequalified-mark-transparent.png","assets/brand/icon-180.png","assets/brand/icon-192.png","assets/brand/icon-512.png","assets/components/adjuster.webp","assets/components/attachment.webp","assets/components/bearing.webp","assets/components/blocking.webp","assets/components/cg.webp","assets/components/chainlink.webp","assets/components/connectinglink.webp","assets/components/crosby-anchor-shackle.webp","assets/components/edge.webp","assets/components/eyebolt.webp","assets/components/ferrule.webp","assets/components/grabhook.webp","assets/components/hoistring.webp","assets/components/hook.webp","assets/components/latch.webp","assets/components/liftingbeam.webp","assets/components/liftinglug.webp","assets/components/loadshackle.webp","assets/components/masterlink.webp","assets/components/mastersub.webp","assets/components/plateclamp.webp","assets/components/realistic-load-hook.webp","assets/components/roundsling.webp","assets/components/slingbody.webp","assets/components/slingeye.webp","assets/components/spreader.webp","assets/components/swivel.webp","assets/components/tag.webp","assets/components/tagline.webp","assets/components/thimble.webp","assets/components/topshackle.webp","assets/components/webbody.webp","assets/configurations/01-vertical.webp","assets/configurations/02-two-leg-bridle.webp","assets/configurations/03-four-leg-bridle.webp","assets/configurations/04-choker.webp","assets/configurations/05-basket.webp","assets/configurations/06-alloy-chain.webp","assets/configurations/07-synthetic-web.webp","assets/configurations/08-roundsling.webp","assets/configurations/09-spreader-beam.webp","assets/configurations/10-lifting-beam.webp","assets/inspection/wire-bending-fatigue.png","assets/inspection/wire-birdcaging.png","assets/inspection/wire-core-protrusion.png","assets/inspection/wire-crushing.png","assets/inspection/wire-kinking.png","assets/inspection/wire-localized-wear.png","assets/scenarios/hero-rigging-realistic.webp","assets/scenarios/load-share-realistic.webp","assets/scenarios/pump-skid-prelift.webp"];
CORE.push('spreader-visuals.js','spreader-visuals.css',...Array.from({length:10},(_,i)=>`assets/blender/spreader-${30+i*5}.webp`));
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
          if(cached) return cached;
          if(event.request.mode === "navigate") return (await cache.match("index.html")) || Response.error();
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
