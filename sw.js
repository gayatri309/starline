// Starline Lead Desk – offline app shell + background reminders.
const CACHE = "starline-v2";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "favicon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
    .catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
});

// Reminders: shown even when the app is closed.
try { importScripts("firebase-config.js"); } catch (e) {}
if (self.STARLINE_FIREBASE && self.STARLINE_FIREBASE.apiKey) {
  importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
                "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");
  firebase.initializeApp(self.STARLINE_FIREBASE);
  firebase.messaging().onBackgroundMessage(p => {
    const d = p.data || {};
    return self.registration.showNotification(d.title || "Starline", {
      body: d.body || "", icon: "icon-192.png", badge: "badge-72.png",
      vibrate: [250, 100, 250, 100, 500], tag: "starline-" + (d.view || "today"), renotify: true, data: { url: "./" }
    });
  });
}
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(ws => {
    for (const w of ws) if ("focus" in w) return w.focus();
    return clients.openWindow("./");
  }));
});
