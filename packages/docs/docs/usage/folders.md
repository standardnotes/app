---
title: Folders
sidebar_label: Folders
description: How to use the Standard Notes folders extension.
keywords:
  - standard notes
  - docs
  - notes app
  - end-to-end encryption
  - Template
image: /img/logo.png
hide_title: false
hide_table_of_contents: false
---

## Introduction

You can use the [Folders](https://standardnotes.com/extensions/folders) extension to create nested folders from your tags with easy drag and drop. Folders also supports [Smart Tags](/usage/tags), which allow you to build custom filters for viewing your notes.

## Terminology

The words _tags_ and _folders_ can be used interchangeably in the Standard Notes context. However, when discussing their use on the web and desktop apps, it is helpful to distinguish them. The labels located at the top of the app are referred to as _tags_ and the labels located on the left side of the app are referred to as _folders_.

When tags are nested inside other tags, the outer/higher level tag is called a _parent_ tag and the inner/lower level tag is called a _child_ tag.

Nested tags are recorded in a `Parent.Child` format and appear that way on mobile.

## Usage

If you add a child tag to a note, the tag's parent tag may or may not be added depending on how you add the child tag.

If you create a note in a folder (e.g., the **All** folder) and add a child tag using the [Quick Tags](/usage/tags) extension, its parent tag will also be added. If you create a note in the child folder, the child tag will automatically be added to the note, but the tag for the parent folder will not be added.

For example, if your **Recipes** folder includes the **Cakes** and **Pasta** tags, then there are two main ways to approach adding "Spaghetti Recipe" note to the **Pasta** folder:

- Create a note in the **Pasta** folder. One tag will be added: **Recipes.Pasta**.
- Create the note a folder other than the **Pasta** folder and type "Pasta" into the top input field for tags. Two tags will be added: **Recipes** and **Recipes.Pasta**.

:::note

You may need to refresh your app after deleting a folder/tag.

:::

## Development

The Folders Component is written in JavaScript and compiled with Grunt.

## License

The source code for the Folders Component is licensed under GNU [AGPL-3.0-or-later](https://github.com/standardnotes/folders-component/blob/master/LICENSE).

## Resources

- [GitHub](https://github.com/standardnotes/folders-component)
