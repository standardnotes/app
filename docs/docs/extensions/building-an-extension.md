---
id: building-an-extension
title: Building an Extension
sidebar_label: Building an Extension
description: How to build an extension for Standard Notes.
keywords:
  - standard notes
  - docs
  - notes app
  - end-to-end encryption
  - build an extension
image: /img/logo.png
hide_title: false
hide_table_of_contents: false
---

In this section, we'll talk about building **components**, which are a type of extension related to user interface elements that can replace or be appended to areas of the Standard Notes app. They allow us to do cool things like custom editors, nested folders, tag autocomplete, and custom extension bars in the editor pane.

Building a component is easily done using the JavaScript-based [Component Bridge library](https://github.com/sn-extensions/components-api). All you have to do is build a single-page web app using any framework you'd like (plain, Angular, React, etc.), then use our component "bridge" to handle interactions between Standard Notes and your extension, for example, to read or save data.

## Setting up the project

In this example, we'll use our blank-slate ReactJS template to build a utility bar that counts and displays the number of words in the current note.

(The ReactJS template makes it easy to get started. You can also create a project from scratch that utilizes the [Components Bridge library](https://github.com/sn-extensions/components-api).)

1. Clone the [blank-slate](https://github.com/sn-extensions/react-blank-slate) project from GitHub:

   ```bash
   git clone https://github.com/sn-extensions/react-blank-slate.git
   ```

1. Build the project:

   ```bash
   cd react-blank-slate
   npm install
   ```

1. Start the local web server to host the app.

   ```bash
   npm run start
   ```

1. In the command output from above, note the port number used. By default, it will probably be port 8080 if it's available. Open `localhost:8080` in your browser. You should see the text "Component is ready" on the page.

## Installing in Standard Notes

1. In the `app` folder, you will find a file called `ext.json`. This file instructs Standard Notes on how to install your extension. After having run the last step from the previous section (`npm run start`), you should have a localhost endpoint running.

1. In your browser, open `http://localhost:8080/ext.json`, and ensure that the output matches the file contents of the ext.json file. Most importantly, if your dev server is running on a different port, make sure to update the `url` property of the JSON file to reflect the correct value.

1. In the **Standard Notes** desktop application (browser may not work for this), click **Extensions** in the lower left corner of the app, click **Import Extension** in the bottom right of the **Extensions** window, and input your ext.json location: `http://localhost:8080/ext.json`. Then press enter.

1. In the same window, find your installed extension, then press **Activate** to run it.

1. You should now see "Blank Slate" at the bottom left of your notes. Clicking on it should raise a little window which displays "Your component is ready". If you try in your browser, it is possible that the window instead remains white. This is most likely due to your browser blocking Mixed Content page. Search online for how to enable it for your browser.

More detailed instructions on setting up your local environment can be found in the [Local Setup tutorial](/extensions/local-setup).

## Writing the App

1. In order to count the number of words in a note, the component needs access to the "working note", or the note the user is currently editing. In `app/lib/BridgeManager.js`, uncomment the relevant parts of the permissions so it looks like this:

   ```javascript
   var permissions = [
     {
       name: 'stream-context-item',
     },
   ];
   ```

1. Uncomment the function `streamContextItem` so it looks like this:

   ```javascript
   this.componentManager.streamContextItem((item) => {
     this.note = item;
     this.notifyObserversOfUpdate();
   });
   ```

   Whenever a change is made to the working note, the block in that function will be called automatically.

1. In `app/components/Home.js`, create a function called `analyzeNote` that will count the number of words in the note's text:

   ```javascript
   analyzeNote() {
   	let wordCount = this.state.note.content.text.match(/\b/gm).length / 2;
   	this.setState({wordCount: wordCount});
   }
   ```

1. In the constructor of the Home class, call `analyzeNote` in the BridgeManager updateObserver so that it looks like this:

   ```javascript
   BridgeManager.get().addUpdateObserver(() => {
     this.setState({ note: BridgeManager.get().getNote() });
     this.analyzeNote();
   });
   ```

1. In the `render` function, add the following inside the first `div` of the `{this.state.note}` conditional:

   ```html
   <p>Number of words: <strong>{this.state.wordCount}</strong></p>
   ```

Save all changes, then reload the entire Standard Notes web page. You should now see your word count update live as you type.

**Important:** The dev server auto-reloads the extension window inside Standard Notes, and by doing so, destroys the bridge connection between Standard Notes and the extension. Whenever you make a change, it's best to reload the entire Standard Notes window via Ctrl/Cmd + R in either the web or desktop app.

---

If you'd like to see the finished product, switch to the `word-count` branch:

```bash
git checkout word-count
```

## Available Areas

Areas tell Standard Notes where to display a particular component. The current list of available areas are:

| Key             | Description                                                                                                                                                                                                       |
| :-------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tags-list`     | replaces the tags pane with a custom component. We use this for the Folders component.                                                                                                                            |
| `note-tags`     | replaces the editor pane's tags area with a custom component. We use this for autocomplete tags.                                                                                                                  |
| `editor-stack`  | adds custom-sized components in a stack in the editor pane. This does not replace any native modules but simply adds layers on top of the editor pane. We use this for the Action Bar and GitHub Push components. |
| `editor-editor` | replaces the plain text editor with a custom editor. We use this for all of our editors, including Markdown, Code, and Plus.                                                                                      |
| `themes`        | replaces the default css styles with a custom set of styles.                                                                                                                                                      |

![Image of areas](/img/extensions/areas.png)

## Next Steps

There are an unlimited number of things you can build with components that do anything from nested folders in the tags pane and autocomplete in the editor pane, to pushing notes to GitHub or WordPress.

To see how we built [our own components](https://standardnotes.com/extensions), study the source code [available here](https://github.com/sn-extensions).

For questions on development, [post in the forum](https://forum.standardnotes.org) or [join our Slack](https://standardnotes.com/slack).

If you'd like to support Standard Notes and use our secure hosting to install all the components we have to offer, consider purchasing the [Extended subscription](https://standardnotes.com/extended).
