---
slug: import-backups
id: import-backups
title: How to import a backup without being signed in
sidebar_label: Import backups
description: How to import a backup in the Standard Notes web and desktop app without being signed in.
keywords:
  - standard notes
  - docs
  - notes app
  - end-to-end encryption
  - web
  - desktop
  - import backups
  - backups
  - import
  - data
  - account
image: /img/logo.png
hide_title: false
hide_table_of_contents: false
---

## Introduction

We are aware of issues with importing backups belonging to another account when that account is still registered, such as when you are [changing your account email](https://standardnotes.com/help/7/how-can-i-change-my-account-email). If you are signed in to your new account, some tags are duplicated and are not properly assigned to notes and a significant number of notes, tags and/or editors are not imported. We are working on a fix. As a temporary workaround, you can import the backup while signed out of the app before signing in to the new account. Then, when you sign in, choose to merge local data (this is an option that is on by default).

:::note
For the best experience, use a backup that was exported from the [web](https://app.standardnotes.org) or desktop app. A backup that was generated from [CloudLink](https://standardnotes.com/help/27/how-do-i-enable-dropbox-google-drive-or-onedrive-backups) may not work as well.
:::

## Clear your account

If you are trying to change your sync account email from an old email to a new email and tried to import a backup but encountered the issues described above, then you probably want to clear your **new** account before reimporting the backup. Please **do not** clear your **old** account until your backup has been successfully imported in your new account.

There are two ways to clear your account: delete everything using the free Batch Manager extension or use the [reset tool](https://standardnotes.com/reset). The reset tool ensures that your new account is completely empty before you reimport your backup.

## Reimport backup

After clearing your new account, please download a backup from your old account and import it into your new account while merging local data:

1. Open the [web app](https://app.standardnotes.org) or desktop app.

2. Export an encrypted or decrypted backup from your old account via the **Account** menu at the bottom left corner of the app.

3. After you have an export downloaded on your computer, click **Sign Out**, then click **Clear session data**.

4. Click on the **Account** menu. Without signing in, click on **Import Backup** to import your backup into the app. If you are importing an encrypted backup, enter your previous password when prompted.

5. Sign in to your new account with Merge local data **on** (this is on by default).

   a. If you cleared your new account using the Batch Manager, then you can sign in to your new account. Click on **Sign In**, enter your account's credentials, and make sure the **Merge local data** option is selected before clicking on **Sign In** again.

   b. If you cleared your account using the [reset tool](https://standardnotes.com/reset), then you need to register your new account again. Click on **Register**, enter your email and password, confirm the password, and make sure the **Merge local data** option is selected before clicking on **Register** again.

6. After signing in, verify that all your notes, tags, and other items were properly imported into your account.
