const SHELL_CACHE = "chess-shell-v2";
const RUNTIME_CACHE = "chess-runtime-v1";
const SHELL_ASSETS = [
  "/manifest.json",
  "/favicon.svg",
  "/logo192.png",
  "/logo512.png",
  "/assets/images/pieces.svg",
  "/assets/images/pieces-staunty.svg",
  "/assets/images/arrows.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(cacheAppShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  const currentCaches = new Set([SHELL_CACHE, RUNTIME_CACHE]);
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("chess-") && !currentCaches.has(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(new Request(request, { signal: controller.signal }));
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) ?? caches.match("/");
  } finally {
    clearTimeout(timeout);
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function cacheAppShell() {
  const cache = await caches.open(SHELL_CACHE);
  await cache.addAll(SHELL_ASSETS);

  const indexResponse = await fetch(new Request("/", { cache: "reload" }));
  if (!indexResponse.ok) throw new Error("Could not cache the app shell");
  const html = await indexResponse.clone().text();
  await cache.put("/", indexResponse);

  const entryAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1]);
  await cache.addAll(entryAssets);

  const fontAssets = new Set();
  for (const stylesheetPath of entryAssets.filter((path) => path.endsWith(".css"))) {
    const stylesheetUrl = new URL(stylesheetPath, self.location.origin);
    const stylesheet = await (await fetch(stylesheetUrl)).text();
    for (const match of stylesheet.matchAll(/url\(([^)]+)\)/g)) {
      const reference = match[1].replace(/["']/g, "").trim();
      const assetUrl = new URL(reference, stylesheetUrl);
      if (assetUrl.origin === self.location.origin) fontAssets.add(assetUrl.pathname);
    }
  }
  if (fontAssets.size > 0) await cache.addAll([...fontAssets]);
}
