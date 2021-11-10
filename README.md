# Standard Notes
### A safe and private place for your life's work.

Standard Notes is a simple and private notes app available on most platforms, including Web, Mac, Windows, Linux, iOS, and Android. It focuses on simplicity, and encrypts data locally before it ever touches a cloud. This means no one can read your notes but you (not even us).

![](https://standardnotes.com/assets/homepage-hero.png)

<div align="center">

[![latest release version](https://img.shields.io/github/v/release/standardnotes/desktop)](https://github.com/standardnotes/desktop/releases)
[![License](https://img.shields.io/github/license/standardnotes/web?color=blue)](https://github.com/standardnotes/web/blob/main/LICENSE)
[![Slack](https://img.shields.io/badge/slack-standardnotes-CC2B5E.svg?style=flat&logo=slack)](https://standardnotes.com/slack)
[![Twitter Follow](https://img.shields.io/badge/follow-%40standardnotes-blue.svg?style=flat&logo=twitter)](https://twitter.com/standardnotes)

</div>

### Why Standard Notes?

- Simple and easy to use
- Fast and encrypted cross-platform sync
- Free sync on unlimited devices
- Extensible with editors (such as Markdown and Code), themes, and components. [Learn more](https://standardnotes.com/features).
- Open-source and the option to self-host your notes server. You can [host your own Standard Server](https://docs.standardnotes.com/self-hosting/getting-started) in a few easy steps.
- A strong focus on longevity and sustainability. [Learn more](https://standardnotes.com/longevity).

### Creating your private notes account

1. Launch the web app at [app.standardnotes.com](https://app.standardnotes.com).
2. Click Register to create your private notes account.
3. Download Standard Notes on all your devices.
	- [Mac](https://standardnotes.com/download/mac)
	- [Windows](https://standardnotes.com/download/windows)
	- [Linux](https://standardnotes.com/download/linux)
	- [iOS](https://standardnotes.com/download/https://itunes.apple.com/us/app/standard-notes/id1285392450?mt=8)
	- [Android](https://play.google.com/store/apps/details?id=com.standardnotes)
4. You're all set to begin enjoying a new, more freeing notes life. Standard Notes comes out of the box with end-to-end encrypted sync on all your devices.

### Do More

If you're looking to power up your experience with extensions, and help support future development, [learn more about our paid plans](https://standardnotes.com/plans). Our paid plans offer:

- Powerful editors, including the Plus Editor, Simple Markdown, Advanced Markdown, Code Editor, Vim Editor, and the popular Simple Task Editor.
- Beautiful themes to help you find inspiration in any mood, like Midnight, Focused, Futura, Titanium, and Solarized Dark.
- Powerful data care options, including daily encrypted backups delivered directly to your email inbox, as well as automated Dropbox, Google Drive, and OneDrive backups. You'll also be able to configure two-factor authentication to add an additional layer of security to your account.
- Productivity-enhancing components like Folders, Autocomplete Tags, the ever-handy Action Bar, and GitHub Push.

### Publish a Blog

It's no secret we love to write. Standard Notes has become a dependable environment to do your most important work, and this includes publishing your ideas to the world. That's why we created Listed. Listed allows you to create an online publication with automatic email newsletters delivered to your readers, directly from Standard Notes.

[Learn more about Listed.](https://listed.to/)

### Plug In

Plug in to the community of note-lovers and privacy-enthusiasts. Join us on [Slack](https://standardnotes.com/slack), on our [GitHub forum](https://forum.standardnotes.org), and follow new updates on [Twitter](https://twitter.com/StandardNotes).

Developers can create and publish their own extensions. Visit the [documentation hub](https://docs.standardnotes.com/) to learn more.

Questions? Find answers on our [Help page](https://standardnotes.com/help).

🙏

---

### Docker setup

Docker is the quick and easy way to try out Standard Notes. We highly recommend using our official [Docker hub image](https://hub.docker.com/repository/docker/standardnotes/web).

### Standalone instance

Before you start make sure you have a `.env` file copied from the sample `.env.sample` and configured with your parameters.

If your intention is not contributing but just running the app we recommend using our official image from Docker hub like this:
```
docker run -d -p 3001:3001 --env-file=your-env-file standardnotes/web:stable
```

Or if you want to use the `develop` branch that is in a work-in-progress state please use:
```
docker run -d -p 3001:3001 --env-file=your-env-file standardnotes/web:latest
```

You can then access the app at `http://localhost:3001` (please check Docker container logs if the server has started already and is listening on connections).

### Running Locally

This repo contains the core code used in the web app, as well as the Electron-based [desktop application](https://github.com/standardnotes/desktop).

**Instructions:**

1. Ensure you have [Yarn](https://classic.yarnpkg.com) installed
1. Clone the repo
1. `yarn setup`
1. `yarn start`

Then open your browser to `http://localhost:3001`.

---

You can also set the `DEFAULT_SYNC_SERVER` environment variable to set the default server for login and registration.

```
DEFAULT_SYNC_SERVER=https://sync.myserver
```

---

### Other repositories:

- Desktop app: https://github.com/standardnotes/desktop
- Mobile (iOS & Android): https://github.com/standardnotes/mobile
- Extensions: https://github.com/sn-extensions

## Contributing

For contributing we highly recommend you use our docker-compose setup that is provided in this repository.

### Docker compose setup

Use the included [docker-compose.yml](docker-compose.yml) file to build Standard Notes with `docker-compose`. Once your `.env` file has been copied and configured, simply run:

```
docker-compose up -d
```

This should load the app container and run the necessary scripts. You should then be able to reach the app at `http://localhost:3001`
