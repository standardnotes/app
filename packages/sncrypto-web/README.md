# SNCrypto Web

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

Cryptographic primitives as a web library (UMD) - used by [SNJS](https://github.com/standardnotes/snjs).

## Installing

```
yarn add @standardnotes/sncrypto-web
```

## Supported Algorithms

- Argon2id (Libsodium.js)
- XChaCha20+Poly1305 (Libsodium.js)
- PBDKF2 (WebCrypto)
- AES-CBC (WebCrypto)
- HMAC SHA-256
- SHA256

## Tests

Tests are run in the browser due to WebCrypto and WebAssembly dependency.

```
yarn test
```
