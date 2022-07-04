---
slug: intro
id: intro
title: Intro to Extensions
sidebar_label: Intro to Extensions
description: Documentation for the Standard Notes Extensions.
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

## Philosophy

Standard Notes is built on the core principle of simplicity, in hopes of optimizing for longevity. This requires a different sort of architecture and long-term thinking. In today's environment, adding new features can be as easy as installing an external library and hooking it up with just a few lines of code. It's all too common that developers, in hopes of attracting more and more users, add more and more features to their app, until inevitably, the app bloats to oblivion and becomes impossible to maintain.

Rather than tightly couple every feature we dream of building for Standard Notes into the core application code, we chose to design Standard Notes to be thoroughly extensible. This allows us to experiment with new features without polluting the core application and threatening its stability and survivability.

## Sustainability

The Extensions model is also our main fundraising method, and allows us to to offer our core privacy experience at no cost, while sustaining future development by offering advanced features through our [Extended](https://standardnotes.com/extended) program.

Most of our extensions are [open-source](https://github.com/sn-extensions) and available for self-hosting. You can also learn to develop your own extensions by following the guides on this site. However, we encourage you to support the sustainability and future development of this project by [purchasing a subscription](https://standardnotes.com/extensions).

## Types

There are 3 main types of extensions:

1. **Components**: Components are user interface elements that completely swap out areas of Standard Notes with custom behavior. Components include editors (such as the [Markdown Pro Editor](https://standardnotes.com/extensions/markdown-pro) and [Plus Editor](https://standardnotes.com/extensions/plus-editor)), editor stack components (like the [Action Bar](https://standardnotes.com/extensions/action-bar) and [FileSafe](https://standardnotes.com/extensions/filesafe)), and other components (like [Folders](https://standardnotes.com/extensions/folders) and [Quick Tags](https://standardnotes.com/extensions/quick-tags)).

   **[Develop a component →](/extensions/building-an-extension)**

2. **Themes**: Themes change the visual appearance of Standard Notes, and are compatible on all platforms, including desktop, web, and mobile. Some of our own themes include [Midnight](https://standardnotes.com/extensions/midnight) and [Solarized Dark](https://standardnotes.com/extensions/solarized-dark).

   **[Develop a theme →](/extensions/themes)**

3. **Actions**: Actions are an API-based extension interface that are accessible via the Actions menu in the note pane. Actions are triggered manually by the user by selecting an action from the list, and have the ability to interface with the current note and send or retrieve content from a remote server. We use actions for places such as [Listed](https://listed.to), which is our blogging platform for Standard Notes users.

   **[Develop an action →](/extensions/actions)**
