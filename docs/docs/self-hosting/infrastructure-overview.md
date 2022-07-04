---
slug: infrastructure-overview
id: infrastructure-overview
title: Infrastructure Overview
sidebar_label: Infrastructure Overview
description: Standard Notes Infrastructure Overview.
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

## Services

The Syncing Server infrastructure consists of a few different microservices that are responsible for different sets of functionality.

### Syncing Server JS

Syncing Server JS is a TypeScript implementation of our Syncing Server. This is the core of our business logic that is responsible for all operations on user data.

### Syncing Server JS Worker

Syncing Server JS Worker is responsible for all asynchronous tasks that the Syncing Server JS may offload for background processing. This includes for example processing of email backups, resolving issues with note duplicates, sending notes to extensions server, and more.

### Auth

This server is responsible for all authorization and authentication mechanisms. Auth is where all account-related metadata is handled and processed.

### Auth Worker

Similar to Syncing Server JS Worker, Auth Worker is responsible for all asynchronous tasks related to the domain of authentication and authorization. For example, processing account deletion requests and users' post-registration tasks.

### API Gateway

This is the main "entry point" of the entire architecture. API Gateway serves as a router and proxy to all services which are inaccessible directly. All requests from client applications will have to go through API Gateway in order to reach a certain underlying service.

This service will be paired with your reverse proxy for [HTTPS support](./https-support.md)

### DB

MySQL database server. This is where all data is stored.

### Cache

Redis cache node where all temporary data is persisted for performance optimization and auto-expiring features.

In self-host mode, Redis is used by default as a communication queue between services and their workers.
