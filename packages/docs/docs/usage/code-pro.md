---
slug: code-pro
id: code-pro
title: Code Pro Editor (Beta)
sidebar_label: Code Pro Editor
description: How to use the Standard Notes Code Pro Editor.
keywords:
  - standard notes
  - docs
  - notes app
  - end-to-end encryption
  - Code Pro Editor
image: /img/logo.png
hide_title: false
hide_table_of_contents: false
---

Code Pro is a [derived editor](https://standardnotes.com/help/77/what-are-editors) for [Standard Notes](https://standardnotes.com), a free, [open-source](https://standardnotes.com/knowledge/5/what-is-free-and-open-source-software), and [end-to-end encrypted](https://standardnotes.com/knowledge/2/what-is-end-to-end-encryption) notes app.

Code Pro is a code editor powered by the [Monaco Editor](https://microsoft.github.io/monaco-editor/) (Visual Studio Code). It is meant for writing Markdown and 60 other programming languages.

Code Pro is not meant to be used on mobile devices.

## Features

- Syntax highlighting for Markdown and more than 60 other programming languages
  - Languages supported: abap, aes, apex, azcli, bat, c, cameligo, clojure, coffeescript, cpp, csharp, csp, css, dart, dockerfile, fsharp, go, graphql, handlebars, hcl, html, ini, java, javascript, json, julia, kotlin, less, lexon, lua, markdown, mips, msdax, mysql, objective-c, pascal, pascaligo, perl, pgsql, php, plaintext, postiats, powerquery, powershell, pug, python, r, razor, redis, redshift, restructuredtext, ruby, rust, sb, scala, scheme, scss, shell, sol, sql, st, swift, systemverilog, tcl, twig, typescript, vb, verilog, xml, yaml
- Autocompletion
- Intelligent autocompletion for CSS, JavaScript, JSON, Less, Handlebars, HTML, Razor, SCSS, and TypeScript
- Sophisticated search and replace
- Prettier formatting for CSS, GraphQL, Markdown, HTML, JavaScript, Less, TypeScript, Sass, and Yaml. Built-in formatting for JSON.
- Settings: language, font size, tab size (`2` or `4`), theme (light, dark, high contrast, or SN themed), and word wrap (`on`, `off`, and `bounded`)
- Per-note settings
- Buttons to save and load default settings

## Keyboard Shortcuts

Perform these shortcuts with the editor

| Action                                                          | Shortcut                                         |
| :-------------------------------------------------------------- | :----------------------------------------------- |
| Toggle word wrap between `on` and `off` (bounded is unaffected) | <kbd>Alt</kbd> + <kbd>Z</kbd>                    |
| Format code with Prettier^                                      | <kbd>Shift</kbd> + <kbd>Alt</kbd> + <kbd>F</kbd> |
| Toggle Tab Key Moves Focus (vs tab spacing)                     | <kbd>Ctrl/⌘</kbd> + <kbd>M</kbd>                 |

^ For CSS, GraphQL, Markdown, HTML, JavaScript, Less, TypeScript, Sass, and Yaml. Some languages, such as JSON, have built-in formatters.

Each time the editor refreshes (e.g., toggling word wrap, formatting code), the editor remembers your position (line number and column) and centers it on the screen if it's not already in focus.

## Settings

The settings for each note are saved automatically after they are changed. Loading default settings will sync the note's settings with the default settings and save automatically.

### Themes

The Monaco Editor comes with three themes: `vs` (a white/light theme), `vs-dark` (a dark theme like the default theme for VS Code), and `hc-black` (a high contrast dark theme). There is also one more option: `sn-theme`. The `sn-theme` option takes either `vs` or `vs-dark` depending on your system theme and adjusts some of the colors (e.g., link colors) to match the theme. The `sn-theme` is still a work-in-progress.
