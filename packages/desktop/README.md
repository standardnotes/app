# Standard Notes Desktop App

## Running Locally

Most commands below hog up a terminal process and must be conducted in different tabs. Be sure to quit any production version of the app running on your system first.

```bash
yarn install
cd packages/snjs && yarn start # optional to watch snjs changes
cd packages/web && yarn watch # optional to watch web changes
yarn dev # to start compilation watch process for electron-related code
yarn start # to start dev app
```

## Building natively on arm64

Building arm64 releases on amd64 systems is only possible with AppImage, Debian and universal "dir" targets.

Building arm64 releases natively on arm64 systems requires some additional preparation:

- `export npm_config_target_arch=arm64`
- `export npm_config_arch=arm64`

A native `fpm` installation is needed for Debian builds. `fpm` needs to be available in `$PATH`, which can be achieved by running

- `gem install fpm --no-document`

and making sure `$GEM_HOME/bin` is added to `$PATH`.

Snap releases also require a working snapcraft / `snapd` installation.

## Installation

On Linux, download the latest AppImage from the [Releases](https://github.com/standardnotes/app/releases/latest) page, and give it executable permission:

`chmod u+x standard-notes*.AppImage`
