# Markdown Basic

<div align="center">

[![License](https://img.shields.io/github/license/sn-extensions/markdown-basic?color=blue)](https://github.com/sn-extensions/markdown-basic/blob/master/LICENSE)
[![GitHub issues and feature requests](https://img.shields.io/github/issues/sn-extensions/markdown-basic.svg)](https://github.com/sn-extensions/markdown-basic/issues/)
[![Slack](https://img.shields.io/badge/slack-standardnotes-CC2B5E.svg?style=flat&logo=slack)](https://standardnotes.org/slack)
[![GitHub Stars](https://img.shields.io/github/stars/sn-extensions/markdown-basic?style=social)](https://github.com/sn-extensions/markdown-basic)

</div>

## Introduction

Markdown Basic is a [custom editor](https://standardnotes.org/help/77/what-are-editors) for [Standard Notes](https://standardnotes.org), a free, open-source, and [end-to-end encrypted](https://standardnotes.org/knowledge/2/what-is-end-to-end-encryption) notes app.

## Features

- Markdown via Markdown-It
- Syntax Highlighting via Highlight.js
- Optional split pane view
- Task Lists
- Tables
- Footnotes
- Inline external images

## Installation

1. Register for an account at Standard Notes using the [Desktop App](https://standardnotes.org/download) or [Web app](https://app.standardnotes.org). Remember to use a strong and memorable password.
2. Sign up for [Standard Notes Extended](https://dashboard.standardnotes.org/member). Then, follow the instructions [here](https://standardnotes.org/help/29/how-do-i-install-extensions-once-i-ve-signed-up-for-extended) or continue.
3. Click **Extensions** in the lower left corner.
4. Under **Repository**, find **Markdown Basic**.
5. Click **Install**.
6. Close the **Extensions** pop-up.
7. At the top of your note, click **Editor**, then click **Markdown Basic**.
8. Click **Continue**, and you are done!

After you have installed the editor on the web or desktop app, it will automatically sync to your [mobile app](https://standardnotes.org/download) after you log in.

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

```md
| Tables             |      Are      |    Cool |
| ------------------ | :-----------: | ------: |
| col 2 is           |   centered    |   \$149 |
| col 3 is           | right-aligned |  \$4.17 |
| privacy is         |     neat      |  \$2.48 |
| rows don't need to |   be pretty   |   what? |
| the last line is   |  unnecessary  | really? |
| one more           |      row      | Yay! 😆 |
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

## License

[GNU Affero General Public License v3.0](https://github.com/sn-extensions/markdown-basic/blob/master/LICENSE)

## Development

The instructions for local setup can be found [here](https://docs.standardnotes.org/extensions/local-setup). All commands are performed in the root directory:

1. Fork the [repository](https://github.com/sn-extensions/markdown-basic) on GitHub
2. [Clone](https://help.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository) your fork of the repository
3. Type `cd markdown-basic`
4. Run `yarn` to locally install the packages in `package.json`
5. Create `ext.json` as shown [here](https://docs.standardnotes.org/extensions/local-setup) with `url: "http://localhost:8004/dist/index.html"`. Optionally, create your `ext.json` as a copy of `ext.json.sample`.
6. Install `http-server` using `yarn global add http-server` or `npm install -g http-server`
7. Start the server at `http://localhost:8004` using `http-server . --cors -p 8004`
8. Import the extension into the [web](https://app.standardnotes.org) or [desktop](https://standardnotes.org/download) app with `http://localhost:8004/ext.json`.
9. To build the editor, open another command window and run `yarn build` or `npm run build`. For live builds, use `yarn watch` or `npm run watch`. You can also run `yarn start` or `npm run start` and open the editor at `http://localhost:8080`.

## Further Resources

- [GitHub](https://github.com/sn-extensions/markdown-basic/)
- [Issues and Feature Requests](https://github.com/sn-extensions/markdown-basic/issues)
- [Standard Notes Slack](https://standardnotes.org/slack) (for connecting with the Standard Notes Community)
- [Standard Notes Help Files](https://standardnotes.org/help) (for issues related to Standard Notes but unrelated to this editor)