/* Familles de la physique – fonctionnement hors ligne.
   Pour forcer la mise à jour des icônes, changez le numéro de VERSION. */
const VERSION = "v1";
const CACHE = "familles-" + VERSION;
const FICHIERS = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(cles => Promise.all(cles.filter(k => k.startsWith("familles-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  /* la page : d’abord Internet (pour recevoir les nouveaux chapitres), sinon la copie gardée */
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => { const copie = r.clone(); caches.open(CACHE).then(c => c.put("index.html", copie)); return r; })
      .catch(() => caches.match("index.html").then(r => r || caches.match("./"))));
    return;
  }
  /* le reste (icônes, polices) : la copie gardée, puis mise à jour en arrière-plan */
  e.respondWith(caches.match(req).then(enCache => {
    const reseau = fetch(req).then(r => {
      if (r && (r.ok || r.type === "opaque")) { const copie = r.clone(); caches.open(CACHE).then(c => c.put(req, copie)); }
      return r;
    }).catch(() => enCache);
    return enCache || reseau;
  }));
});
