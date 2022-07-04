---
title: Action Bar
sidebar_label: Action Bar
description: How to use the Standard Notes Action Bar.
keywords:
  - standard notes
  - docs
  - notes app
  - end-to-end encryption
  - action bar
image: /img/logo.png
hide_title: false
hide_table_of_contents: false
---

## Introduction

The Action Bar is a utility bar for Standard Notes. It provides information about the current note and a few useful actions.

## Information

The Action Bar provides the following information:

- The title of the note
- The date and time when the note was created
- The date and time when the note was last updated
- The approximate number of words in the note (as determined by the spaces)
- The approximate number of paragraphs in the note (as determined by line skips)
- The number of characters in the note
- The approximate read time of the note in minutes (approximated with a read speed of 200 words per minute)

## Actions

The Action Bar provides the following actions:

- Copy the current date to your clipboard in the format `Month/Date/Year, Hour:Minute AM/PM`
- Duplicate the note
- Copy the contents of the note to your clipboard
- Save the contents of the note to a file.
- Email the note. This creates and clicks a `mailto:` link with the note's title as the subject of the email and the note's content as the body of the email.

:::tip
The default extension for saving a note is `.txt`. You can also save your files with `.md`, `.html`, and `.tex` extensions. If you frequently export a note with a particular file extension, you can add the extension to the title of the note. For example, naming your note `My Blog Post.md` or `Book.tex` will export the notes as `.md` and `.tex` files, respectively.
:::

## Development

The Action Bar is written in JavaScript and compiled with Grunt.

1. Clone the [action-bar](https://github.com/standardnotes/action-bar) repository from GitHub.
2. Run `npm install` to install required dependencies.
3. Ensure that either the Standard Notes desktop app is available for use or the web app is accessible. Use both locally or with an Extended account (or the extension will not load).
4. Follow the instructions [here](/extensions/local-setup) to setup the extension locally.
   - For the `area` property, use `editor-stack`
5. Begin development! Upon making any changes to the code, run `grunt` to build the files to the `dist` folder.

## License

The Action Bar is licensed under the GNU [AGPL-3.0-or-later](https://github.com/standardnotes/action-bar/blob/master/LICENSE).

## Resources

- [GitHub](https://github.com/standardnotes/action-bar)
