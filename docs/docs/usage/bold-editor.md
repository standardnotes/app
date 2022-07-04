---
id: 'bold-editor'
title: Bold Editor
sidebar_label: Bold Editor
description: How to use the Standard Notes bold editor.
keywords:
  - standard notes
  - docs
  - notes app
  - end-to-end encryption
  - bold editor
image: /img/logo.png
hide_title: false
hide_table_of_contents: false
---

export const Highlight = ({children, color}) => ( <span style={{
      backgroundColor: color,
      borderRadius: '2px',
      color: '#fff',
      padding: '0.2rem',
    }}> {children} </span>
//#28a745 green
//#1877F2 blue
//#ffc107 yellow
//#dc3545 red
 );

## Introduction

The Bold Editor is a [derived editor](https://standardnotes.com/help/77/what-are-editors) for Standard Notes. It is derived from the [Redactor](https://imperavi.com/redactor). The instructions for adding in-line images, videos, and audio recordings are available [here](https://standardnotes.com/help/71/how-do-i-add-images-to-my-notes).

### <Highlight color="#1877F2">Warning</Highlight>

Changing the editor for a note to the Bold Editor will add `html` tags around each line of your text. These tags will be present when you change the editor back to a markdown editor.

If you want to convert a note from HTML to plaintext, you will need to remove these tags manually or by using a separate text editor such as [VS Code](https://code.visualstudio.com/) or [Atom](https://atom.io) because we do not yet have a "find and replace" feature. If you would like to test the Bold Editor with your note, you can restore a previous copy of the note in the Session History. If you restore an old copy, then any changes made with the Bold Editor will be lost.

The search feature in the [Minimist editor](https://standardnotes.com/extensions/markdown-minimist) may help you remove the tags manually.

## Keyboard Shortcuts

| Result             | Shortcut                         |
| :----------------- | :------------------------------- |
| Remove format      | Ctrl/⌘ + m                       |
| Undo               | Ctrl/⌘ + z                       |
| Redo               | Ctrl/⌘ + y or Shift + Ctrl/⌘ + z |
| Bold               | Ctrl/⌘ + b                       |
| Italic             | Ctrl/⌘ + i                       |
| Superscript        | Ctrl/⌘ + h                       |
| Subscript          | Ctrl/⌘ + l                       |
| Link               | Ctrl/⌘ + k                       |
| Ordered List       | Ctrl/⌘ + Shift + 7               |
| Unordered List     | Ctrl/⌘ + Shift + 8               |
| Outdent            | Ctrl/⌘ + [                       |
| Indent             | Ctrl/⌘ + ]                       |
| Normal (Pagagraph) | Ctrl/⌘ + Alt + 0                 |
| Heading 1          | Ctrl/⌘ + Alt + 1                 |
| Heading 2          | Ctrl/⌘ + Alt + 2                 |
| Heading 3          | Ctrl/⌘ + Alt + 3                 |
| Heading 4          | Ctrl/⌘ + Alt + 4                 |
| Heading 5          | Ctrl/⌘ + Alt + 5                 |
| Heading 6          | Ctrl/⌘ + Alt + 6                 |

## Further Resources

- [GitHub](https://github.com/standardnotes/bold-editor) - Development instructions, license (AGPL-3.0-or-later), and source code.
