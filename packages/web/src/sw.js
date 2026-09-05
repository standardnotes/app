const CACHE_NAME = 'sn-app-v1'

// keep in sync with webpack copy patterns in web.webpack.config.js
const APP_SHELL = [
  '/',
  '/index.html',
  '/app.js',
  '/app.css',
  '/favicon/favicon.ico',
  '/favicon/favicon-32x32.png',
  '/favicon/apple-touch-icon.png',
  '/manifest.webmanifest',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL)
    })
  )
  // dont wait for old tabs to close
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // let API calls and websocket stuff go straight to network
  if (request.url.includes('/api/') || request.url.includes('/socket')) {
    return
  }

  // navigation requests: network first, fall back to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          // stash a fresh copy if it's good
          if (resp.ok) {
            const clone = resp.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return resp
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // everything else: cache first, then network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // refresh cache in bg
        fetch(request)
          .then((resp) => {
            if (resp.ok) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, resp))
            }
          })
          .catch(() => {})
        return cached
      }

      return fetch(request).then((resp) => {
        // only cache same-origin stuff
        if (resp.ok && new URL(request.url).origin === self.location.origin) {
          const clone = resp.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return resp
      })
    })
  )
})
