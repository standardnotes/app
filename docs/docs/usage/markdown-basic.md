---
id: 'markdown-basic'
title: Markdown Basic Editor
sidebar_label: Markdown Basic
description: How to use the Standard Notes Markdown Basic editor.
keywords:
  - standard notes
  - docs
  - notes app
  - end-to-end encryption
  - markdown basic
image: /img/logo.png
hide_title: false
hide_table_of_contents: false
---

## Introduction

Markdown Basic is a [custom editor](https://standardnotes.com/help/77/what-are-editors) for Standard Notes. It uses Markdown-It to parse Markdown.

## Features

- Markdown via Markdown-It
- Syntax Highlighting via Highlight.js
- Optional split pane view
- Task Lists
- Tables
- Footnotes
- Inline external images

## Installation

1. Register for an account at Standard Notes using the [Desktop App](https://standardnotes.com/download) or [Web app](https://app.standardnotes.org). Remember to use a strong and memorable password.
2. Sign up for [Standard Notes Extended](https://dashboard.standardnotes.com/member). Then, follow the instructions [here](https://standardnotes.com/help/29/how-do-i-install-extensions-once-i-ve-signed-up-for-extended) or continue.
3. Click **Extensions** in the lower left corner.
4. Under **Repository**, find **Markdown Basic**.
5. Click **Install**.
6. Close the **Extensions** pop-up.
7. At the top of your note, click **Editor**, then click **Markdown Basic**.
8. Click **Continue**.

After you have installed the editor on the web or desktop app, it will automatically sync to your [mobile app](https://standardnotes.com/download) after you sign in.

## Style Guide

| Result             | Markdown                                     |
| :----------------- | :------------------------------------------- |
| **Bold**           | \*\*text\*\* or \_\_text\_\_                 |
| _Emphasize_        | \*text\* or \_text\_                         |
| ~~Strike-through~~ | \~\~text\~\~                                 |
| Link               | [text]\(http://)                             |
| Image              | ![text]\(http://)                            |
| `Inline Code`      | \`code\`                                     |
| Code Block         | \`\`\`language <br></br>code <br></br>\`\`\` |
| Unordered List     | \* item <br></br> - item <br></br> + item    |
| Ordered List       | 1. item                                      |
| Task List          | `- [ ] Task` or `- [x] Task`                 |
| Blockquote         | \> quote                                     |
| H1                 | # Heading                                    |
| H2                 | ## Heading                                   |
| H3                 | ### Heading                                  |
| H4                 | #### Heading                                 |
| Section Breaks     | `---` or `***`                               |

## Tables

Colons can be used to align columns.
Copy this into your editor to see what it renders:

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

## Footnotes

The Markdown Basic editor supports footnotes. The footnote links do not work properly on mobile. Copy this into your note to see how they're used:

```md
You can create footnote references that are short[^1] or long.[^2]
You can also create them inline.^[which may be easier,
since you don't need to pick an identifier and move down to type the note]
The footnotes are automatically numbered at the bottom of your note,
but you'll need to manually number your superscripts.
Make sure to count your variable[^variable] footnotes.[^5]

[^1]: Here's a footnote.
[^2]: Here’s a footnote with multiple blocks.

  Subsequent paragraphs are indented to show that they belong to the previous footnote.

  { eight spaces for some code }

  The whole paragraph can be indented, or just the first
  line. In this way, multi-paragraph footnotes work like
  multi-paragraph list items.

This paragraph won’t be part of the footnote, because it
isn’t indented.

[^variable]: The variable footnote is the fourth footnote.
[^5]: This is the fifth footnote.
```

#### Not yet available:

- KaTeX
- Printing
- Custom Font Families
- Custom Font Sizes
- Superscript
- Subscript

## Further Resources

- [GitHub](https://github.com/sn-extensions/markdown-basic/) - Development instructions, license (AGPL-3.0-or-later), and source code.
