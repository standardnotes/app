# advanced-checklist

A great way to manage short-term and long-term to-do's. You can mark tasks as completed, change their order, and edit the text naturally in place.

## Development

**Prerequisites:** Install [Node.js](https://nodejs.org/en/), [Yarn](https://classic.yarnpkg.com/en/docs/install/), and [Git](https://github.com/git-guides/install-git) on your computer.

The general instructions setting up an environment to develop Standard Notes extensions can be found [here](https://docs.standardnotes.org/extensions/local-setup). You can also follow these instructions:

1. Fork the [repository](https://github.com/standardnotes/advanced-checklist) on GitHub.
1. [Clone](https://help.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository) your fork of the repository.
1. Run `cd advanced-checklist` to enter the `advanced-checklist` directory.
1. Run `yarn install` to install the dependencies on your machine as they are described in `yarn.lock`.

### Testing in the browser

1. To run the app in development mode, run `yarn start` and visit http://localhost:8001. Press `ctrl/cmd + C` to exit development mode.

### Testing in the Standard Notes app

1.  Create an `ext.json` in the `public` directory. You have three options:
    1.  Use `sample.ext.json`.
    1.  Create `ext.json` as a copy of `sample.ext.json`.
    1.  Follow the instructions [here](https://docs.standardnotes.org/extensions/local-setup) with `url: "http://localhost:3000/index.html"`.
1.  Install http-server using `sudo npm install -g http-server` then run `yarn server` to serve the `./build` directory at http://localhost:3000.
1.  To build the app, run `yarn build`.
1.  Install the editor into the [web](https://app.standardnotes.org) or [desktop](https://standardnotes.org/download) app with `http://localhost:3000/sample.ext.json` or with your custom `ext.json`. Press `ctrl/cmd + C` to shut down the server.

### Deployment

1. To make the source code prettier, run `yarn pretty`.
1. To the deploy the build into the `gh-pages` branch of your repository on GitHub, run `yarn deploy-stable`.
1. To deploy the build into to the `dev` branch for testing, run `yarn deploy-dev`.
1. To deploy the built into the `build` branch for distributing, run `yarn deploy-build` for distributing builds.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Available Scripts

In the project directory, you can run:

#### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:8001](http://localhost:8001) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

#### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

#### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

#### `yarn eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

### Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
