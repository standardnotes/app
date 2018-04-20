# Standard Notes
### A safe and private place for your life's work.

Standard Notes is a simple and private notes app available on most platforms, including Web, Mac, Windows, Linux, iOS, and Android. It focuses on simplicity, and encrypts data locally before it ever touches a cloud. This means no one can read your notes but you (not even us).

![](https://standardnotes.org/assets/homepage-hero.png)

### Why Standard Notes?

- Simple and easy to use
- Fast and encrypted cross-platform sync
- Free sync on unlimited devices
- Extensible with editors (such as Markdown and Code), themes, and components (like Folders and Autocomplete Tags). Learn more about [Extended](https://standardnotes.org/extensions).
- Open-source and the option to self-host your notes server. You can [host your own Standard Server](https://docs.standardnotes.org/self-hosting.html) in a few easy steps.
- A strong focus on longevity and sustainability. [Learn more](https://standardnotes.org/longevity).

### Creating your private notes account

1. Launch the web app at [app.standardnotes.org](https://app.standardnotes.org).
2. Click Register to create your private notes account.
3. Download Standard Notes on all your devices.
	- [Mac](https://standardnotes.org/download/mac)
	- [Windows](https://standardnotes.org/download/windows)
	- [Linux](https://standardnotes.org/download/linux)
	- [iOS](https://standardnotes.org/download/https://itunes.apple.com/us/app/standard-notes/id1285392450?mt=8)
	- [Android](https://play.google.com/store/apps/details?id=com.standardnotes)
4. You're all set to begin enjoying a new, more freeing notes life. Standard Notes comes out of the box with end-to-end encrypted sync on all your devices.

### Do More

If you're looking to power up your experience with extensions, and help support future development, [learn more about Extended](https://standardnotes.org/extensions). Extended offers:

- Powerful editors, including the Plus Editor, Simple Markdown, Advanced Markdown, Code Editor, Vim Editor, and the popular Simple Task Editor.
- Beautiful themes to help you find inspiration in any mood, like Midnight, Focused, Futura, Titanium, and Solarized Dark.
- Powerful data care options, including daily encrypted backups delivered directly to your email inbox, as well as automated Dropbox, Google Drive, and OneDrive backups. You'll also be able to configure two-factor authentication to add an additional layer of security to your account.
- Productivity-enhancing components like Folders, Autocomplete Tags, the ever-handy Action Bar, and GitHub Push.

### Publish a Blog

It's no secret we love to write. Standard Notes has become a dependable environment to do your most important work, and this includes publishing your ideas to the world. That's why we created Listed. Listed allows you to create an online publication with automatic email newsletters delivered to your readers, directly from Standard Notes.

[Learn more about Listed.](https://listed.to/)

### Plug In

Plug in to the community of note-lovers and privacy-enthusiasts. Join us on [Slack](https://standardnotes.org/slack), on our [GitHub forum](https://forum.standardnotes.org), and follow new updates on [Twitter](https://twitter.com/StandardNotes).

Developers can create and publish their own extensions. Visit the [documentation hub](https://docs.standardnotes.org/) to learn more.

Questions? Find answers on our [Help page](https://standardnotes.org/help).

🙏

---

### Running Locally

This repo contains the core code used in the web app, as well as the Electron-based [desktop application](https://github.com/standardnotes/desktop).

**Note:** Ruby `2.3.1` is currently required for local development. [RVM](https://rvm.io/rvm/install) is a good solution if you need to install and use that version of Ruby.

**Instructions:**

1. Clone the repo
1. `bundle install`
1. `npm install`
1. `bundle exec rake bower:install`
1. `npm run grunt`
5. `rails s`

Open your browser to http://localhost:3000.

### Other repositories:

- Desktop app: https://github.com/standardnotes/desktop
- Mobile (iOS & Android): https://github.com/standardnotes/mobile
- Extensions: https://github.com/sn-extensions
