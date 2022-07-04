---
slug: configuration-options
id: configuration-options
title: Configuration options
sidebar_label: Configuration options
description: Manage options for your Standard Notes Standalone Infrastructure.
keywords:
  - standard notes
  - docs
  - notes app
  - end-to-end encryption
  - self-hosting
  - sync server
  - configuration options
image: /img/logo.png
hide_title: false
hide_table_of_contents: false
---

## Note

After changing any of the environment variables mentioned below you will have to restart the infrastructure in order for the changes to take effect. You can do so with the following command:

  ```bash
  $ ./server.sh stop && ./server.sh start
  ```


## Syncing Server JS & Syncing Server Worker

All configuration options mentioned below are controlled by environment variables located in the `.env` file.

### Basics

- `LOG_LEVEL`: the level of logs outputted by the Syncing Server JS and Syncing Server JS Worker services.
- `NODE_ENV`: Node environment in which the service is running.

### Secrets

- `AUTH_JWT_SECRET`: secret used to sign the JWT tokens that are used for authorization & authentication purposes between services.

### Ports

- `EXPOSED_PORT`: the port on which the API Gateway will run. It is your main entry point for the entire infrastructure.

### Database

- `DB_HOST`: database host.
- `DB_REPLICA_HOST`: database replica host. If no replica is supported it should point to the same host as the primary DB.
- `DB_PORT`: database port.
- `DB_USERNAME`: database username.
- `DB_PASSWORD`: database password.
- `DB_DATABASE`: database name.
- `DB_DEBUG_LEVEL`: the level of logs which are outputted in the database context. Related to TypeORM.
- `DB_MIGRATIONS_PATH`: path to migrations folder that should be run against the database. Related to TypeORM.

### Cache

- `REDIS_URL`: url to Redis node.

### Redis Async Communication (Default)

- `REDIS_EVENTS_CHANNEL`: name of the Redis Pub/Sub channel used for communication between the service and its worker.

### AWS Async Communication (Optional)

If you do not want to use Redis as the communication channel between services, you can configure your async communication to be done via Amazon Web Services.

> **Note** We do not support configuring AWS secret and access keys in the environment variables as this is generally bad practice. If you would like to utilize SNS, SQS and S3, please configure an appropriate IAM user and role for the server on which you self-host your application as [best practice](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html#sharing-credentials).

- `SNS_TOPIC_ARN`: ARN of the SNS topic that the service will publish events to.
- `SNS_AWS_REGION`: AWS region of the SNS topic.
- `SQS_QUEUE_URL`: URL of the SQS queue from which a worker will consume events.
- `SQS_AWS_REGION`: AWS region of the SQS queue.
- `S3_BACKUP_BUCKET_NAME`: name of the S3 bucket on which a file backup will be performed to transfer large data between services.
- `S3_AWS_REGION`: AWS region of the S3 bucket.

### Auth Service

-`AUTH_SERVER_URL`: url to the Auth service. Default value should be kept.

### Emails

- `EMAIL_ATTACHMENT_MAX_BYTE_SIZE`: Amount of bytes allowed for daily email backup attachments.

### Revisions

- `REVISIONS_FREQUENCY`: Amount of seconds that should pass between each save of a note for a new history revision to be created.

### New Relic (Optional)

We are utilizing New Relic to monitor our infrastructure. If you wish to set up your own monitoring in New Relic you can utilize the following environment variables:

- `NEW_RELIC_ENABLED`: enable or disable New Relic agent.
- `NEW_RELIC_APP_NAME`: name of the application to show in New Relic.
- `NEW_RELIC_LICENSE_KEY`: New Relic license key.
- `NEW_RELIC_NO_CONFIG_FILE`: should be true as we do not use configuration files for New Relic and fallback to environment variables.
- `NEW_RELIC_DISTRIBUTED_TRACING_ENABLED`: enable or disable distrubuted tracing.
- `NEW_RELIC_LOG_ENABLED`: enable or disable logs in New Relic.
- `NEW_RELIC_LOG_LEVEL`: level of logs in New Relic.

## Auth & Auth Worker

All configuration options mentioned below are controlled by environment variables located in the `docker/auth.env` file.

### Basics

- `LOG_LEVEL`: the level of logs outputted by the Auth and Auth Worker services.
- `NODE_ENV`: Node environment in which the service is running.

### Secrets

- `JWT_SECRET`: secret used to sign the JWT tokens that are used for authorization & authentication purposes between client and server.
- `LEGACY_JWT_SECRET`: This parameter is a fallback for supporting old client applications that had a different authorization mechanism. You don't need to change this if you are just starting to self-host your setup and do not own a legacy client application.
- `AUTH_JWT_TTL`: Time to live in seconds for the JWT token used for communication between services.
- `PSEUDO_KEY_PARAMS_KEY`: key used to generate password nonce in the process of creating user authentication parameters.
- `ENCRYPTION_SERVER_KEY`: key used for ecrypting user server key. Must be a hex string exactly 32 bytes long e.g. `feffe9928665731c6d6a8f9467308308feffe9928665731c6d6a8f9467308308`.

### Authentication and Authorization

- `ACCESS_TOKEN_AGE`: time to live (in seconds) of the access token used to communicate with the server.
- `REFRESH_TOKEN_AGE`: time to live (in seconds) of the refresh token used to obtain a new access token.
- `EPHEMERAL_SESSION_AGE`: time to live (in seconds) of an ephemeral session. Used when you sign in without the "Stay signed in" option checked.
- `MAX_LOGIN_ATTEMPTS`: number of login attempts before locking the account.
- `FAILED_LOGIN_LOCKOUT`: lockout period in seconds after maximum failed login attempts.

### Redis Async Communication (Default)

- `REDIS_EVENTS_CHANNEL`: name of the Redis Pub/Sub channel used for communication between the service and its worker.

### Syncing Server Service

-`SYNCING_SERVER_URL`: url to the Syncing Server service. Default value should be kept.

### Disabling new user registrations

- `DISABLE_USER_REGISTRATION`: disable the option to register new users on the server.

### New Relic (Optional)

We are utilizing New Relic to monitor our infrastructure. If you wish to set up your own monitoring in New Relic you can utilize the following environment variables:

- `NEW_RELIC_ENABLED`: enable or disable New Relic agent.
- `NEW_RELIC_APP_NAME`: name of the application to show in New Relic.
- `NEW_RELIC_LICENSE_KEY`: New Relic license key.
- `NEW_RELIC_NO_CONFIG_FILE`: should be true as we do not use configuration files for New Relic and fallback to environment variables.
- `NEW_RELIC_DISTRIBUTED_TRACING_ENABLED`: enable or disable distrubuted tracing.
- `NEW_RELIC_LOG_ENABLED`: enable or disable logs in New Relic.
- `NEW_RELIC_LOG_LEVEL`: level of logs in New Relic.

## API Gateway

All configuration options mentioned below are controlled by environment variables located in the `docker/api-gateway.env` file.

### Basics

- `LOG_LEVEL`: the level of logs outputted by the API Gateway service.
- `NODE_ENV`: Node environment in which the service is running.

### Routing

- `SYNCING_SERVER_JS_URL`: url to the Syncing Server JS service.
- `AUTH_SERVER_URL`: url to the Auth service.

### New Relic (Optional)

We are utilizing New Relic to monitor our infrastructure. If you wish to set up your own monitoring in New Relic you can utilize the following environment variables:

- `NEW_RELIC_ENABLED`: enable or disable New Relic agent.
- `NEW_RELIC_APP_NAME`: name of the application to show in New Relic.
- `NEW_RELIC_LICENSE_KEY`: New Relic license key.
- `NEW_RELIC_NO_CONFIG_FILE`: should be true as we do not use configuration files for New Relic and fallback to environment variables.
- `NEW_RELIC_DISTRIBUTED_TRACING_ENABLED`: enable or disable distrubuted tracing.
- `NEW_RELIC_LOG_ENABLED`: enable or disable logs in New Relic.
- `NEW_RELIC_LOG_LEVEL`: level of logs in New Relic.
