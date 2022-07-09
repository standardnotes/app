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

Our self-hosted server infrastructure consists of different microservices responsible for varying functionality. The self-hosted server works as the _backend_ that processes and stores your data; it does not include the web application.

The web application is an optional process that you must spin up separately. However, you can use the [existing web app](https://app.standardnotes.com) or the official Standard Notes desktop app with your self-hosted server.

:::tip Quick start

The fastest and easiest way to get up and running is to use our automated Docker setup. All you need is a Linux server and the latest version of [Docker](https://docs.docker.com/get-started).

[Check out our Docker instructions page to get started →](./docker.md)

:::

## Infrastructure overview

### API Gateway

The main entry point of the architecture. The API Gateway is a router and proxy for all services which are otherwise inaccessible directly. All requests from client applications go through the API Gateway to reach a target underlying service. This service is configured with your reverse proxy for public HTTPS support.

### Syncing Server

Responsible for user data and syncing operations.

### Syncing Server Worker

Responsible for asynchronous tasks the Syncing Server may offload for background processing, including email backups, revision history, and more.

### Auth

Responsible for authorization and authentication mechanisms within Standard Notes.

### Auth Worker

Responsible for asynchronous tasks related to the domain of authentication and authorization, including account deletion requests and post-registration tasks.

### Database

The database is where data is stored.

### Cache

A Redis cache node is used to store temporary data for performance optimization and auto-expiring features. In self-hosted mode, Redis is used as a communication queue between services and workers.

## Troubleshooting

If you run into any issues setting up your server, please [open an issue on GitHub](https://github.com/standardnotes/standalone/issues) or reach out on the [Standard Notes Discord](https://standardnotes.com/discord).

## Web application

If you would like to self-host the actual Standard Notes web application, visit the [repository for the Standard Notes web app on GitHub](https://github.com/standardnotes/app/tree/main/packages/web).

## Self-hosting without Docker?

Configuring the full Standard Notes architecture manually can be challenging without detailed study. We do not offer support for this method of self-hosting. [The only supported self-hosting method is to use Docker →](./docker.md)

