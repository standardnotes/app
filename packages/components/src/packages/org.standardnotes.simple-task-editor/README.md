# Simple Task Editor

The Simple Task Editor is a [Custom Editor](https://standardnotes.org/help/77/what-are-editors) for Standard Notes. You can find a demo [here](https://standardnotes.org/demo).

## Installation
1. Purchase an [Extended Subscription](https://standardnotes.org/extensions)
1. Follow the instructions to [install an editor](https://standardnotes.org/help/29/how-do-i-install-extensions-once-i-ve-signed-up-for-extended)

## Development

The instructions for local setup can be found [here](https://docs.standardnotes.org/extensions/local-setup). All commands are performed in the root directory:

1. Run `npm install` to locally install the packages in `package.json`
1. Create `ext.json` as shown [here](https://docs.standardnotes.org/extensions/local-setup) with `url: "http://localhost:8001/dist/index.html"`.
1. Install an http server using `npm install -g http-server`
1. Start the server using `http-server -p 8001 --cors`
1. Import the extension into the [web](https://app.standardnotes.org) or [desktop](https://standardnotes.org/download) app using `http://localhost:8001/ext.json`.

To build the editor, open another command window and run `npm run build`. For live builds, use `npm run watch`.
