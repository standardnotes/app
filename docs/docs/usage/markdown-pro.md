---
id: 'markdown-pro'
title: Markdown Pro
sidebar_label: Markdown Pro
description: How to use the Standard Notes Markdown Pro editor.
keywords:
  - standard notes
  - docs
  - notes app
  - end-to-end encryption
  - markdown pro
image: /img/logo.png
hide_title: false
hide_table_of_contents: false
---

## Introduction

The Markdown Pro editor (aka Advanced Markdown Editor) is a [derived editor](https://standardnotes.com/help/77/what-are-editors) for Standard Notes. It is derived from the [Easy Markdown Editor](https://github.com/Ionaru/easy-markdown-editor) which uses [Codemirror](https://github.com/codemirror/codemirror).

## Features

- Markdown with live side-by-side rendering
- Three views: Edit, Split, and Preview
- Keyboard Shortcuts
- Inline styling with HTML/CSS

## Keyboard Shortcuts

| Result              | Shortcut         |
| :------------------ | :--------------- |
| Toggle Preview      | Ctrl/⌘ + P       |
| Toggle Side-by-Side | Ctrl/⌘ + Alt + P |

## Style Guide

| Result             | Markdown                                  | Shortcut                            |
| :----------------- | :---------------------------------------- | :---------------------------------- |
| **Bold**           | \*\*text\*\* or \_\_text\_\_              | Ctrl/⌘ + B                          |
| _Emphasize_        | \*text\* or \_text\_                      | Ctrl/⌘ + I                          |
| ~~Strike-through~~ | \~text\~ or \~\~text\~\~                  | ❔                                  |
| Link               | [text]\(http://)                          | Ctrl/⌘ + K                          |
| Image              | ![text]\(http://)                         | Ctrl/⌘ + Alt + I                    |
| `Inline Code`      | \`code\`                                  | ❔                                  |
| `Code Block`       | \`\`\`code\`\`\`                          | Ctrl/⌘ + Alt + C or tab or 7 spaces |
| Unordered List     | \* item <br></br> - item <br></br> + item | Ctrl/⌘ + L                          |
| Ordered List       | 1. item                                   | Ctrl/⌘ + Alt + L                    |
| Remove List        |                                           | Ctrl/⌘ + E                          |
| Blockquote         | \> quote                                  | Ctrl + ' or Ctrl + "                |
| H1                 | # Heading                                 | Ctrl/⌘ + H                          |
| H2                 | ## Heading                                | Ctrl/⌘ + H (×2)                     |
| H3                 | ### Heading                               | Ctrl/⌘ + H (×3)                     |

### Lists

Enter a space in front of the asterisk or number to indent the list.
Copy this into your editor to see what it creates:

```
1. First ordered list item
2. Another item
 * One space for unordered sub-list item
 - One space for another sub-list item
    * Press tab for sub-sub-list item
  		1. Two tabs for sub-sub-sub list item 😀
1. Actual numbers don't matter, just that it's a number
 1. One space for ordered sub-list item
 1. One space for another sub-list item
    * Press Tab
    1. One tab
	    * Two tabs. You got it! 👏
4. And another item. Success! 🎉
```

## Tables

Colons can be used to align columns.
Copy this into your editor to see what it creates:

```
| Tables           |      Are      |   Cool    |
| ---------------- | :-----------: | --------: |
| col 2 is         |   centered    |    \$149   |
| col 3 is         | right-aligned |    \$4.17  |
| privacy is       |    neat       |    \$2.48  |
| rows don't need to  |be pretty|     what? |
| the last line is | unnecessary   |   really?
| one more         |    row        |   Yay! 😆
```

## Inline Styling

You can personalize the styling of the editor with inline HTML/CSS. For example, if you want to use monospace font for the editor, add this to your note, and replace `var(--sn-stylekit-monospace-font)` with your preferred font-families:

```html
<style>
  .CodeMirror {
    font-family: var(--sn-stylekit-monospace-font);
  }
</style>
```

If you want to use monospace font for the preview, adjust the styles for `.editor-preview`:

```html
<style>
  .CodeMirror,
  .editor-preview {
    font-family: var(--sn-stylekit-monospace-font);
  }
</style>
```

#### Not yet available:

- Footnotes
- Superscript
- Subscript
- Syntax Highlighting
- Printing
- Default Custom Fonts

## Further Resources

- [GitHub](https://github.com/standardnotes/markdown-pro) - Development instructions, license (AGPL-3.0-or-later), and source code.
