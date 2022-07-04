---
slug: getting-started
id: getting-started
title: Getting Started with Self-hosting
sidebar_label: Getting Started
description: How to get started with self-hosting Standard Notes Infrastructure.
keywords:
  - standard notes
  - docs
  - notes app
  - end-to-end encryption
  - self-hosting
  - sync server
image: /img/logo.png
hide_title: false
hide_table_of_contents: false
---

Our self-hosted server infrastructure consists of several different microservices that are responsible for different sets of functionality. Our self-hosted server is only intended as the backend that processes and stores your data; it does not include self-hosting the web application, which is an optional process that must be done separately. You will be able to use our existing [web](https://app.standardnotes.com) and desktop app with your self-hosted server.

## Get Started

👉 **[Using our automated docker-compose setup with accompanying scripts](./docker.md)** 👈

If you'd like to learn more about each of the particular services, head over to [Infrastructure Overview](./infrastructure-overview.md).

> **Note** Our setup also provides a running MySQL database and a Redis cache node. You do not have to provision these services on your own. For users that have been self-hosting a legacy version of our server, we've prepared a [Migrating from Legacy guide](./legacy-migration.md).

### Recommendations

We highly recommend you use our Docker setup to host your syncing server. Docker containers are isolated software environments that you can control and manage.

If you are new to Docker, please see the [official Docker documentation](https://docs.docker.com/get-started) on how to get started. Ensure you [install Docker-Compose](https://docs.docker.com/compose/install/) following the documentation. Your Linux distribution may not have the most up to date docker-compose and will fail to load.

We recommend avoiding setting up your syncing server from scratch with Nginx unless you are proficient with Nginx. Setting up the full architecture can be challenging without full knowledge of how the syncing server and its microservices function.

### Issues

If you have any issues with setting up your syncing server, please [open an issue on GitHub](https://github.com/standardnotes/standalone/issues).

## Web application

If you would like to self-host the actual Standard Notes web application, visit the [repository for the web app on GitHub](https://github.com/standardnotes/web).
