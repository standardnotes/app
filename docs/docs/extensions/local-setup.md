---
id: local-setup
title: Local Setup
sidebar_label: Local Setup
description: How to set up a development environment to build a Standard Notes extension.
keywords:
  - standard notes
  - docs
  - notes app
  - end-to-end encryption
  - build an extension
  - local setup
image: /img/logo.png
hide_title: false
hide_table_of_contents: false
---

These instructions describe how to run an extension in a local environment.

Installing an extension inside Standard Notes consists of two main components:

- A JSON file that describes the extension, and includes metadata such as the extension's current version, description, hosted URL, and download URL.
- The source code for the extension.

To get your extension running locally, both of these components must be hosted on a local web server. In this guide, we'll use the command line server `http-server`.

## Steps

1. Install http-server:

   ```bash
    npm install -g http-server
   ```

1. In your extension's root directory, run the following command to begin hosting your local server:

   ```bash
   http-server -p 8001 --cors
   ```

   The `--cors` option allows the Standard Notes app to load your extension via cross-origin resource sharing (required).

1. In your extension's root directory, create a file called `ext.json`.

1. Place, at minimum, the following key/value pairs. For the full listing of keys, see the [Publishing guide](/extensions/publishing).

   ```json
   {
     "identifier": "org.yourdomain.my-extension",
     "name": "My Extension",
     "content_type": "SN|Component",
     "area": "editor-editor",
     "version": "1.0.0",
     "url": "http://localhost:8001"
   }
   ```

   The `url` should point to where your extension's index.html is hosted on your local server.
   The `area` describes what kind of extension this will be. A list of valid values can be found in the [Publishing guide](/extensions/publishing).

1. In your browser, open http://localhost:8001/ext.json and make sure you see the JSON file content from above.

1. Copy the `url` from the JSON content and open it in your browser. Here, you should see your actual extension running. Your server will look for an `index.html` file by default.

   If your main HTML file is called something different, or is not located in the root directory, simply change the `url` value in the JSON file to reflect this location. For example:

   ```bash
   url: "http://localhost:8001/dist/index.html"
   ```

1. At this point, your extension is ready to be installed. Open **Standard Notes**, and click on **Extensions** in the lower left corner of the app.

1. In the bottom right of the **Extensions** window, click **Import Extension**. In the Extension Link field, enter the URL of your ext.json file. In this case, it will be `http://localhost:8001/ext.json`. Then press enter.

1. You should see a message that your extension was successfully installed. You can now scroll up in the **Extensions** window, and click **Activate** next to your extension to run it. If it is an editor, Editors can be activated via the **Editor menu** in the note panel, under the note title.

---

### Themes

If you're creating a theme, you would follow the same instructions, and for `area` in the JSON file, use "themes", and for the URL, it should link directly to your css file, i.e `http://localhost:8001/theme.css`.

### Publishing

Once you're ready to ship your extension in a production environment, check out the [Publishing guide](/extensions/publishing) to learn more about configuring your extension to autoupdate and be installed in an offline environment.
