---
title: Smart Views
sidebar_label: Smart Views
description: How to use the Standard Notes Smart Views.
keywords:
  - standard notes
  - docs
  - notes app
  - end-to-end encryption
  - tags
  - views
  - filters
image: /img/logo.png
hide_title: false
hide_table_of_contents: false
---

Questions:

- How do I view a list of untagged notes (and create other dynamic filters)?

## Introduction

“Smart Views" are user-made dynamic folders that organize your notes according to predefined filters.

For example, suppose you wanted to see a list of all notes whose title starts with “Foo”. You can do this by creating a smart tag.

## Creating A Smart View

1. Create a new folder by clicking the + icon.
1. Copy and paste the following Smart View syntax, as the folder name:

   ```
   !["Foo Notes", "title", "startsWith", "Foo"]]
   ```

1. Press enter on your keyboard.

At this point, you should see an item called "Foo notes" under **Views**. You can select this item to view a list of your notes that start with “Foo”.

## Understanding The Smart View Syntax

Smart Views can be used to construct any kind of simple query. The components of the smart tag syntax are as follows:

`!`: Indicates the start of a Smart View

`[...]`: A JSON array

- The first item in the JSON array is the display label.
- The second item is the note attribute you are targeting.
- The third is the comparison operator.
- And the last is the expected value.

## More Examples

Show all notes that have tags that start with the letter b:

```
!["B-tags", "tags", "includes", ["title", "startsWith", "b"]]
```

Show all notes that have tags `Blog` or `Ideas`:

```
!["Blog or Ideas", "tags", "includes", ["title", "in", ["Blog", "Ideas"]]]
```

Show notes that are pinned:

```
!["Pinned", "pinned", "=", true]
```

Show notes that are not pinned:

```
!["Not Pinned", "pinned", "=", false]
```

Show notes that have been updated within the last day:

```
!["Last Day", "updated_at", ">", "1.days.ago"]
```

Show notes whose text has more than 500 characters:

```
!["Long", "text.length", ">", 500]
```

### Compound Predicates

You can use compound and/or predicates to combine multiple queries. For example, to show all notes that are pinned and locked:

```
!["Pinned & Locked", "ignored", "and", [["pinned", "=", true], ["locked", "=", true]]]
```

Show all notes that are protected or pinned:

```
!["Protected or Pinned", "ignored", "or", [["content.protected", "=", true], ["pinned", "=", true]]]
```

Show all notes that have tags `Blog` or `Ideas`.

```
!["Blog Scheduled or Published", "ignored", "or", [["tags", "includes", ["title", "=", "Blog"]], ["tags", "includes", ["title", "=", "Ideas"]]]]
```

You can also use the not predicate to negate an expression. For example, to show all notes that do not have the `Unread` tag:

```
!["Read", "tags", "not", ["tags", "includes", ["title", "=", "Unread"]]]
```

The not predicate can be combined with the compound operators. For example, to show all notes that have the Blog tag but not the Ideas one:

```
!["Blog Unpublished", "ignored", "and", [["tags", "includes", ["title", "=", "Blog"]], ["", "not", ["tags", "includes", ["title", "=", "Ideas"]]]]]
```

## Attributes

Here are a list of note attributes that can be queried:

- `title`
- `title.length`
- `text`
- `text.length`
- `tags`
- `updated_at`
- `created_at`
- `pinned`
- `content.protected`

If constructing a filter that queries tags, you can use the following tag attributes:

- `title`
- `title.length`
- `updated_at`
- `created_at`

Note that Smart Views always query notes, and so the query you're building refers to notes firstmost. You reference tags by referring to a note's tags:

```
!["B-tags", "tags", "includes", ["title", "startsWith", "b"]]
```

Get all notes whose tags includes a title that starts with the letter b.

## Operators

Here are a list of operators that can be used to construct filters. The operator is typically the third parameter in the filter syntax.

- `=`
- `>`
- `<`
- `>=`
- `<=`
- `startsWith`
- `in` ("whether a value is in a list of values")
- `includes` ("includes sub filter")
- `matches` (regex pattern)
- `and` (for compound filters)
- `or` (for compound filters)
- `not` (negates the expected value, attribute is ignored)
