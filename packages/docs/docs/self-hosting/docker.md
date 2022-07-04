---
slug: docker
id: docker
title: Self-hosting with Docker
sidebar_label: Docker
description: How to self-host the Standard Notes infrastructure with Docker.
keywords:
  - standard notes
  - docs
  - notes app
  - end-to-end encryption
  - self-hosting
  - sync server
  - docker
image: /img/logo.png
hide_title: false
hide_table_of_contents: false
---

## Requirements

These instructions make the following assumptions:

- The machine you will be running the infrastructure on has at least 2GB of memory.
- You've just finished setting up a Linux server (say, Ubuntu 20.04 64-bit) and have installed [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) on it.
- Due to mounted volumes we recommend running the setup as a root user. If you wish to run it as non-root user please remember about the [post-installation steps for Linux](https://docs.docker.com/engine/install/linux-postinstall#manage-docker-as-a-non-root-user).
- You've configured your security groups to allow for incoming SSH connections from your local IP.
- You've configured your security groups to allow for incoming TCP connections on port 80 and 443 from at least your local IP.
- You've configured a domain name (or subdomain) to point to your server's IP address.

## Getting started

> **Note** If you are a user with an already existing legacy database of the Syncing Server, we've prepared a [Migrating from Legacy guide](./legacy-migration.md).

SSH into your server and follow the steps below:

1. Make sure you are in your home directory and clone the [Standard Notes Standalone Infrastructure](https://github.com/standardnotes/standalone) project:

   ```bash
   $ cd ~
   $ git clone --single-branch --branch main https://github.com/standardnotes/standalone.git
   $ cd standalone
   ```

1. Initialize default configuration files by typing:

   ```bash
   $ ./server.sh setup
   ```

1. Customize your configuration

  There are 5 environment variables that need to be filled in with generated secret keys:

   - `AUTH_JWT_SECRET` in the `.env` file
   - `JWT_SECRET`, `LEGACY_JWT_SECRET`, `PSEUDO_KEY_PARAMS_KEY`, and `ENCRYPTION_SERVER_KEY` in the `docker/auth.env` file

  You can generate values for them by using:

  ```bash
   $ openssl rand -hex 32
   ```

  > **Note** The server must be restarted any time environment variables are changed.

1. (Optional) Customize the port

  By default the syncing server will run on port 3000. If you have a different service running on that port, you can customize the port on which you want to run the infrastructure on. To do so, edit the `EXPOSED_PORT` variable in the `.env` file.

2. Simply run:

   ```bash
   $ ./server.sh start
   ```

   This should load all the microservices that the infrastructure consists of.

  > **Note** The first run might take a few minutes as there are Docker images that need be pulled and built as well as migrations to be run for initializing the database.

3. Wait for the infrastructure to bootstrap

   It takes a moment for the infrastructure to bootstrap and all the microservices to start. You can observe the process by typing:

   ```bash
   $ ./server.sh logs
   ```

  > **Note** You can safely escape from logs with CTRL+C

  > **Note** Microservices depend on each other and start sequentially in our setup. In the logs you will likely observe that one service is waiting for another to start with lines like: "XYZ is unavailable yet - waiting for it to start" where XYZ is the dependent service name. This is expected.

   Everything should be up and running once you observe that the `API Gateway` service has started by seeing the following line as one of the last ones in logs:

   ```
   api-gateway_1 | {"message":"Server started on port 3000","level":"info"}
   ```

   You can also check the state of all services via:

   ```bash
   $ ./server.sh status
   ```

   All services should be in `Up` state at this stage.

4. Test your access to the server locally:

   You should be able now to check that the syncing server is running by checking `http://localhost:3000/healthcheck`:

   ```bash
   $ curl http://localhost:3000/healthcheck
   OK
   ```

   > **Note** If you changed the `EXPOSED_PORT` variable you will have to check `http://localhost:{EXPOSED_PORT}/healthcheck`.

5. You're done!

## Securing Your Server

In order to start using your new server with the Standard Notes app at https://app.standardnotes.com you will have to configure an HTTPS reverse proxy.

Unless you already have an HTTP/HTTPS server running that will serve as a reverse proxy to the standalone infrastructure, head over to [Securing HTTP traffic of your Sync server](./https-support.md).

## Using your new server

In the account menu, choose `Advanced options` and enter the address of your new server in `Custom sync server`.

Then, register for a new account or log into an existing account and begin using your private new secure Standard Notes server!
