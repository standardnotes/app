---
slug: editors/getting-started
id: editors-getting-started
title: Getting Started with Building Editors
sidebar_label: Getting Started
description: Getting Started with Building Editors
keywords:
  - standard notes
  - docs
  - notes app
  - end-to-end encryption
  - Getting Started with Building Editors
image: /img/logo.png
hide_title: false
hide_table_of_contents: false
---

## Overview

This page provides a list of links to the technologies and practices that we recommend using for building editors. These technologies are used in the [Editor Template - Create React App and TypeScript](https://github.com/standardnotes/editor-template-cra-typescript). If you are familiar with React, TypeScript, and Sass, then you can skip this overview and go straight to the [README.md of the Editor Template](https://github.com/standardnotes/editor-template-cra-typescript#readme).

### Platforms

- [GitHub](https://github.com/) - A website to store the source code of your editor and to host a usable copy of your editor

### Programming Languages

We recommend using the following programming languages to build editors:

- [HTML](https://developer.mozilla.org/en-US/docs/Web/HTML) - A programming language for conveying meaning
- [CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) - A programming language for conveying style
- [SCSS](https://sass-lang.com/documentation/syntax) - A programming language that is like CSS but is easier to write
- [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript) - A programming language for performing tasks
- [TypeScript](https://www.typescriptlang.org/) - A programming language that is like JavaScript but is easier to check for errors

### Environment

To get started with building editors, we recommend downloading the following technologies on your desktop computer:

- [Node.js](https://nodejs.org/) - An environment where you can run JavaScript code to run
- NPM or [Yarn](https://yarnpkg.com/) - A [package manager](https://wikipedia.org/wiki/Package_manager) for the JavaScript programming language. NPM comes with Node.js, but we use Yarn
- [Visual Studio Code](https://code.visualstudio.com/) - A text editor to edit the source files of your editor
- [Git Bash](https://git-scm.com/downloads) - A tool to interact with your file system

### Packages and Libraries

We recommend using the following packages and libraries:

- [Prettier](https://prettier.io/docs/en/index.html) - A package for formatting your code
- [ESLint](https://eslint.org/docs/user-guide/getting-started) - A package for checking your JavaScript and TypeScript code for errors
- [React](https://reactjs.org/docs/getting-started.html) - A library for building web applications using JavaScript
- [Create React App](https://create-react-app.dev/) - A package that makes it easy to get started with React

### Practices

We recommend that you follow these practices:

- [Conventional Commits](https://www.conventionalcommits.org/) - A specification for adding human and machine readable meaning to commit messages

## Files

The [Editor Template - Create React App and TypeScript](https://github.com/standardnotes/editor-template-cra-typescript) has the following files:

```none
editor-template-cra-typescript
├── .gitignore
├── .prettierrc
├── LICENSE
├── README.md
├── package.json
├── tsconfig.json
├── yarn.lock
├── public
│   ├── favicon.ico
│   ├── index.html
│   ├── logo192.png
│   ├── logo512.png
│   ├── manifest.json
│   ├── package.json
│   ├── robots.txt
│   └── sample.ext.json
└── src
    ├── Editor.test.tsx
    ├── index.scss
    ├── index.tsx
    ├── logo.svg
    ├── react-app-env.d.ts
    ├── reportWebVitals.ts
    ├── setupTests.ts
    ├── components
    │   └── Editor.tsx
    └── stylesheets
        ├── dark.scss
        ├── main.scss
        └── print.scss
```

When you are familiar with these technologies, follow the instructions in the [README.md of the Editor Template](https://github.com/standardnotes/editor-template-cra-typescript#readme).
