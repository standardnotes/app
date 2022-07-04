---
id: 'markdown-math'
title: Markdown Math
sidebar_label: Markdown Math
description: How to use the Standard Notes Markdown Math editor.
keywords:
  - standard notes
  - docs
  - notes app
  - end-to-end encryption
  - markdown math
image: /img/logo.png
hide_title: false
hide_table_of_contents: false
---

## Introduction

The Markdown Math editor (aka Math Editor) is a [derived editor](https://standardnotes.com/help/77/what-are-editors) for Standard Notes. It is derived from the [Upmath](https://github.com/parpalak/upmath.me) editor by [Roman Parpalak](https://github.com/parpalak), but uses [KaTeX](https://katex.org) for client-side rendering. Because the original Upmath editor and the Markdown Math editor render math using slightly different methods, some TeX libraries and their environments may be available in the Upmath editor but not in the Markdown Math editor. For a full list of functions supported by KaTeX, please see the [official KaTeX documentation](https://katex.org/docs/supported.html).

## Features

- $\LaTeX$ math rendering via [$\KaTeX$](https://katex.org)
- Markdown with side-by-side live rendering
- Option to view the HTML source of the rendered markdown
- Option to overwrite the note text with the contents of a text file on local storage
- Option to download the plain note text as a text file to save on local storage
- Option to download the HTML source of the rendered text as a text file to save on local storage

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
| Blockquote         | \> quote                                     |
| H1                 | # Heading                                    |
| H2                 | ## Heading                                   |
| H3                 | ### Heading                                  |
| H4                 | #### Heading                                 |
| Section Breaks     | `---` or `***`                               |

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

## $\KaTeX$

The Markdown Math editor requires double dollar signs. For example, `$$\int_0^\infty f(x)dx$$` or `$$\pi$$` should yield $$\int_0^\infty f(x)dx$$ and $$\pi$$.

To use Display Mode in the KaTeX, use double dollar signs on new lines. For example,

```latex
Text

$$
\int_0^\infty f(x)dx
$$

More Text
```

should yield:

Text

$$
\int_0^\infty f(x)dx
$$

More Text

### $\KaTeX$ Tables

Please see [here](https://katex.org/docs/supported.html) and [here](https://katex.org/docs/support_table.html) for tables of all the functions and symbols that $\KaTeX$ supports.

## Further Resources

- [GitHub](https://github.com/sn-extensions/math-editor) - Development instructions, license (AGPL-3.0-or-later), and source code.
