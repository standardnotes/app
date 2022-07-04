---
slug: file-uploads
id: file-uploads
title: File Uploads
sidebar_label: File Uploads
description: How to setup file uploading on your Standard Notes Standalone Server.
keywords:
  - standard notes
  - docs
  - notes app
  - end-to-end encryption
  - self-hosting
  - files
  - uploads
  - docker
image: /img/logo.png
hide_title: false
hide_table_of_contents: false
---

## Requirements

In order to upload files you have to have an active subscription for your user. Read the [subscriptions](./subscriptions.md) page on instructions how to setup a subscription for yourself.

## Troubleshooting

### Files Server URL

In your `.env` file the environment variable `FILES_SERVER_URL` has to be set to a publicly accessible url. The reason for that is that the clients are accessing the Files Server directly instead of via Api Gateway. Remember that if you are hosting your standalone instance on an external server then `localhost` is not the host that properly describes where the files server resides.

### Upload directory write permissions

The default upload directory is located inside the standalone folder under `data/uploads`. Depending on the running OS, you might encounter write permissions to that folder by the application. In that case the following commands might help:

```bash
chmod -R 775 data
mkdir -p data/uploads
sudo chmod -R 755 data/uploads
sudo chown -R 1001.1001 data/uploads
```

### Limiting Storage Quota

If you would like to limit the file upload quota for your user then make sure to run the following query on your database:

```sql
INSERT INTO subscription_settings(uuid, name, value, created_at, updated_at, user_subscription_uuid) VALUES (UUID(), "FILE_UPLOAD_BYTES_LIMIT", 10737418240, FLOOR(UNIX_TIMESTAMP(NOW(6))*1000000), FLOOR(UNIX_TIMESTAMP(NOW(6))*1000000), (SELECT us.uuid FROM user_subscriptions us INNER JOIN users u ON us.user_uuid=u.uuid WHERE u.email="EMAIL@ADDR"));
```

Note that this is setting the limit to 10GB (10737418240 bytes) for user with email `EMAIL@ADDR`

### CloudFlare Missing Headers

When using CloudFlare in conjuction with Nginx you might encounter an issue about missing `Accept-Ranges` header which is required for file downloading. As a fix please add this to your Nginx configuration:

```
proxy_cache off;
```
