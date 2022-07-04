---
slug: updating
id: updating
title: Updating Standard Notes Standalone Infrastructure
sidebar_label: Updating
description: How to update Standard Notes Standalone Infrastructure.
keywords:
  - standard notes
  - docs
  - notes app
  - end-to-end encryption
  - self-hosting
  - updating
  - sync server
  - docker
image: /img/logo.png
hide_title: false
hide_table_of_contents: false
---

## Requirements

These instructions make the following assumptions:

- You have an existing standalone infrastructure running with our [docker setup](./docker.md)

## Updating

Updating of the infrastructure essentially consists of:

- Stopping all services
- Pulling changes from Git
- Checking for env file changes: new environment variables might have been added that you will need to configure
- Downloading latest Docker image versions of Standard Notes services
- Starting the services up again

To save you all the trouble we've packed it all nicely in one command that you run by typing:

```bash
$ ./server.sh update
```

## Troubleshooting

If you encounter any problems while updating, you can nuke your setup and start over. But **you must backup your data** inside the `data/*` folder. Then, to wipe your existing setup, run:

```bash
$ ./server.sh cleanup
```

> ***WARNING*** this will permanently delete all your data, so be sure to back up your database before running this command.
