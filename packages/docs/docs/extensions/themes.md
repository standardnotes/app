---
id: themes
title: Themes
sidebar_label: Themes
description: How to build a theme for Standard Notes.
keywords:
  - standard notes
  - docs
  - notes app
  - end-to-end encryption
  - build an extension
  - theme
image: /img/logo.png
hide_title: false
hide_table_of_contents: false
---

Themes allow you to customize the look and feel of the Standard Notes app on all platforms.

You can view the [source code](https://github.com/sn-extensions/solarized-dark-theme) of our official themes in order to best understand how to create your own theme.

For how to install a theme, please see [Publishing](/extensions/publishing).

## Creating a theme

Themes are simple CSS files which override a few variables to style the look of the application. **CSS themes will automatically work on mobile.** Your CSS file should contain content similar to the below.

_Note that font and font sizes do not apply to mobile; only desktop/web._

```css
:root {
  --sn-stylekit-base-font-size: 14px;

  --sn-stylekit-font-size-p: 1rem;
  --sn-stylekit-font-size-editor: 1.21rem;

  --sn-stylekit-font-size-h6: 0.8rem;
  --sn-stylekit-font-size-h5: 0.9rem;
  --sn-stylekit-font-size-h4: 1rem;
  --sn-stylekit-font-size-h3: 1.1rem;
  --sn-stylekit-font-size-h2: 1.2rem;
  --sn-stylekit-font-size-h1: 1.3rem;

  --sn-stylekit-neutral-color: #989898;
  --sn-stylekit-neutral-contrast-color: white;

  --sn-stylekit-info-color: #086dd6;
  --sn-stylekit-info-contrast-color: white;

  --sn-stylekit-success-color: #2b9612;
  --sn-stylekit-success-contrast-color: white;

  --sn-stylekit-warning-color: #f6a200;
  --sn-stylekit-warning-contrast-color: white;

  --sn-stylekit-danger-color: #f80324;
  --sn-stylekit-danger-contrast-color: white;

  --sn-stylekit-shadow-color: #c8c8c8;
  --sn-stylekit-background-color: white;
  --sn-stylekit-border-color: #e3e3e3;
  --sn-stylekit-foreground-color: black;

  --sn-stylekit-contrast-background-color: #f6f6f6;
  --sn-stylekit-contrast-foreground-color: #2e2e2e;
  --sn-stylekit-contrast-border-color: #e3e3e3;

  --sn-stylekit-secondary-background-color: #f6f6f6;
  --sn-stylekit-secondary-foreground-color: #2e2e2e;
  --sn-stylekit-secondary-border-color: #e3e3e3;

  --sn-stylekit-secondary-contrast-background-color: #e3e3e3;
  --sn-stylekit-secondary-contrast-foreground-color: #2e2e2e;
  --sn-styleki--secondary-contrast-border-color: #a2a2a2;

  --sn-stylekit-editor-background-color: var(--sn-stylekit-background-color);
  --sn-stylekit-editor-foreground-color: var(--sn-stylekit-foreground-color);

  --sn-stylekit-paragraph-text-color: #454545;

  --sn-stylekit-input-placeholder-color: rgb(168, 168, 168);
  --sn-stylekit-input-border-color: #e3e3e3;

  --sn-stylekit-scrollbar-thumb-color: #dfdfdf;
  --sn-stylekit-scrollbar-track-border-color: #e7e7e7;

  --sn-stylekit-general-border-radius: 2px;

  --sn-stylekit-monospace-font: 'Ubuntu Mono', courier, monospace;
  --sn-stylekit-sans-serif-font: -apple-system, BlinkMacSystemFont, 'Segoe UI',
    'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
    'Helvetica Neue', sans-serif;
    
  --sn-stylekit-grey-1:  #72767e;
  --sn-stylekit-grey-2:  #bbbec4;
  --sn-stylekit-grey-3:  #dfe1e4;
  --sn-stylekit-grey-4:  #eeeff1;
  --sn-stylekit-grey-4-opacity-variant:  #bbbec43d;
  --sn-stylekit-grey-5:  #f4f5f7;
  --sn-stylekit-grey-6:  #e5e5e5;
  
  --sn-stylekit-accessory-tint-color-1:  #086dd6;
  --sn-stylekit-accessory-tint-color-2:  #ea6595;
  --sn-stylekit-accessory-tint-color-3:  #ebad00;
  --sn-stylekit-accessory-tint-color-4:  #7049cf;
  --sn-stylekit-accessory-tint-color-5:  #1aa772;
  --sn-stylekit-accessory-tint-color-6:  #f28c52;
}
```

In order to get SN to display a dock icon for your theme (a circle in the lower right corner of the app that allows you to quickly toggle themes), add the following payload into the your ext.json file when [publishing your theme](/extensions/publishing):

```json
"dock_icon": {
   "type": "circle",
   "background_color": "#086DD6",
   "foreground_color": "#ffffff",
   "border_color": "#086DD6"
}
```

### Reloading Mobile Themes

The mobile app will download a theme once and cache it indefinitely. If you're installing your own mobile theme and make changes, you can press and hold on the theme name in the list to bring up the option to re-download the theme from the server.

### 3.9.15 Changes

Since v3.9.15, the items in the notes list use a new variable for the background color, which will partially break the look of your theme when a note is selected or is hovered upon. In order to fix this, override the `--sn-stylekit-grey-5` color to one which fits your theme. You might also need to override the `--sn-stylekit-grey-4-opacity-variant` variable if the tags inside the note item don't look correct.

## Licensing

Our themes are provided open-source mainly for educational and quality purposes. You're free to install them on your own servers, but please consider subscribing to [Standard Notes Extended](https://standardnotes.com/extensions) to help sustain future development of the Standard Notes ecosystem.
