# @standardnotes/clipper

## Development flow

- Run `yarn watch:web` in a terminal to watch changes in the `@standardnotes/web` package

### Chromium

- Run `yarn watch-mv3` in another terminal to watch changes in the extension source

#### "Load unpacked" method

- Go to `chrome://extensions`
- Enable `Developer mode`
- Click "Load unpacked" and select the `dist` folder in the current package

You might need to manually press the reload button when you make changers

#### CLI method

```console
yarn run-chromium --chromium-profile=PATH/TO/PROFILE
```

- You might need to specify the Chromium binary using the `--chromium-binary` argument
- Running `yarn run-chromium` without the `--chromium-profile` argument will create a new temporary profile every time

This method will automatically reload the extension when you make changes

### Firefox

- Run `yarn watch` in another terminal to watch changes in the extension source

```console
yarn run-firefox --firefox-profile=PATH/TO/PROFILE
```

- You might need to specify the Firefox binary using the `--firefox` or `-f` argument
- Running `yarn run-firefox` without the `--firefox-profile` argument will create a new temporary profile every time

## Build

## Firefox

```console
yarn build-firefox
```

## Chromium

```console
yarn build-chromium
```
