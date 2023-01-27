# SNJS

SNJS is a client-side JavaScript library for [Standard Notes](https://standardnotes.com) that contains shared logic for all Standard Notes clients.

## Introduction

SNJS is a shared library for use in all Standard Notes clients (desktop, web, and mobile). Its role is to extract any business or data logic from client code, so that clients are mostly responsible for UI-level code, and don’t have to think about encryption and key management, or even authentication or storage specifics. Extracting the code into a shared library also prevents us from having to write the same critical code on multiple platforms.

The entry point of SNJS is the [`SNApplication`](packages/snjs/lib/application.ts) class. The application class is a complete unit of application functionality. Theoretically, many instances of an application can be created, each with its own storage namespace and memory state. This can allow clients to support multiple user accounts.

An application must be supplied a custom subclass of [DeviceInterface](packages/snjs/lib/device_interface.ts). This allows the library to generalize all behavior a client will need to perform throughout normal client operation, such as saving data to a local database store, saving key/values, and accessing the keychain.

On Web platforms SNJS interacts with [`sncrypto`](https://github.com/standardnotes/snjs/tree/packages/sncrypto-common) to perform operations as mentioned in the [specification](https://github.com/standardnotes/snjs/blob/main/packages/snjs/specification.md) document. This includes operations like key generation and data encryption.

SNJS also interacts with a Standard Notes [syncing server](https://github.com/standardnotes/syncing-server-js), which is a zero-knowledge data and sync store that deals with encrypted data, and never learns of client secrets or sensitive information.

## Installation

`yarn add snjs`

## Integrating in module environment

```javascript
import { SNApplication } from 'snjs';
```

## Integrating in non-module web environment

```javascript
<script src="snjs.js"></script>
Object.assign(window, SNLibrary);
```

## Building

1. `yarn install --pure-lockfile`
2. `yarn start` to start Webpack in development mode (watches changes), or `yarn build` to create dist files.

## Tests

### E2E Tests

#### Prerequisites

To run a stable server environment for E2E tests that is up to date with production, clone the [self-hosted repository](https://github.com/standardnotes/self-hosted). Make sure you have everything set up configuration wise as in self-hosting docs. In particular, make sure the env files are created and proper values for keys are set up.

Make sure you have the following value in the env vars mentioned below. It's important to have low token TTLs for the purpose of the suite. For the most up to date values it's best to check `self-hosted` github workflows. At the moment of writting the recommended values are:
```
# docker/auth.env
...
ACCESS_TOKEN_AGE=4
REFRESH_TOKEN_AGE=10
EPHEMERAL_SESSION_AGE=300

# .env
...
REVISIONS_FREQUENCY=5
```

#### Start Server For Tests (SELF-HOSTED)

In the `self-hosted` folder run:

```
EXPOSED_PORT=3123 ./server.sh start && ./server.sh wait-for-startup
```

Wait for the services to be up.

#### Run Test Suite (APP)

Once the server infrastructure is ready, and you've built all packages, you can run the test suite in the browser.

In the `app` folder run:

```
yarn e2e
```

#### Troubleshooting

Before running the E2E test suite you might want to run in the `app` folder `yarn build:snjs` to make sure you are running the test suite against the most recent changes you have locally.

### Unit Tests

From the root of the repository, run:

```
yarn run test
```
