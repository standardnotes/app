---
slug: legacy-migration
id: legacy-migration
title: Migrating From Legacy
sidebar_label: Migrating From Legacy
description: Migrating From Legacy Guide
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

## Preparing a database dump

If you have previously self-hosted your setup with our legacy Syncing Server, you will need to first dump the data from your existing database. There are two ways to do this depending on whether you had a separate database or the one we provided with our Docker setup.

### Database from Docker setup

In order to create a database dump, use the following command:

   ```bash
   $ docker exec your_db_container_id sh -c 'exec mysqldump your_database_name -uroot -p "your_password"' > ./dbdump.sql
   ```

  > **Note:** In order to get the value of `your_db_container_id`, run `docker ps` to inspect your running containers. `your_database_name` and `your_password` have to be changed to whatever you had set up in your .env file.

### External database

Run:

  ```bash
  mysqldump your_database_name -h your_host -u your_user -p "your_password" > ./dbdump.sql
  ```

  > **Note** Change `your_host`, `your_database_name`, `your_user` and `your_password` to values that you use to connect to your database.

## Importing your database dump

In order to import your data to the database that our Standalone setup will create, just place your `dbdump.sql` file inside the `path-to-your-standalone/data/import` folder. The data will be imported once the setups starts.

To proceed, head over to our [Self-hosting with Docker](./docker.md) page.
