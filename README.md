# Tutter

A personal tutorial platform. Write tutorials as markdown files; Tutter turns them into a static site with chapters, highlighted code, images/GIFs, downloads, interactive quizzes and progress tracking.

```sh
npm install
npm run dev        # http://localhost:4321, live-reloads as you edit tutorials
npm run build      # static site in dist/ (host anywhere, or `npm run preview`)
npm test           # unit tests
npm run check      # type check
```

Progress (completed pages, quiz results, last visited page) lives in your browser's localStorage. Use **Progress → Export** to save it as JSON and **Import** on another device or browser; imports merge, so nothing gets lost.

## Writing a tutorial

```
tutorials/
  godot-pong/                  ← one folder per tutorial (URL: /godot-pong/)
    tutorial.md                ← required: tutorial metadata
    01-setup/                  ← chapter (URL: /godot-pong/setup/)
      chapter.md               ← optional: chapter title, summary, intro text
      01-install-godot.md      ← page (URL: /godot-pong/setup/install-godot/)
      02-new-project.md
      images/preview.gif       ← anything next to the markdown can be referenced
      files/pong-ch1-end.zip
    02-paddles/
      …
```

- **Order** comes from numeric prefixes (`01-`, `02-`…), which are stripped from URLs. Set `order:` in frontmatter to override.
- **Renaming** a file or folder changes its URL and progress id; **reordering** (changing only the prefix) does not.
- Missing `chapter.md`? The chapter title is derived from the folder name (`03-game-over` → "Game over").
- `godot-pong/` is a complete example that uses every feature; copy it as a starting point.

### Frontmatter

`tutorial.md`

```yaml
---
title: Pong in Godot 4            # required
description: Build classic Pong…  # required
engine: Godot                     # optional badge
difficulty: beginner              # beginner | intermediate | advanced
tags: [gdscript, 2d]
cover: ./cover.png                # optional card image
order: 1                          # optional library order
---
```

`chapter.md`: `title` (required), `summary`, `order`. Any body text is shown as the chapter intro.

Pages: `title` (required), `description`, `estimatedMinutes`, `order`.

Invalid frontmatter fails the build with the file name.

### Code blocks

Powered by [Expressive Code](https://expressive-code.com/key-features/syntax-highlighting/): any Shiki language (`gdscript`, `csharp`, `cpp`, `ini`, …), plus:

````md
```gdscript title="paddle.gd" {4,9} ins={12-13} del={2}
```
````

`title` adds a file tab, `{4,9}` highlights lines, `ins`/`del` mark diff lines. Every block gets a copy button.

### Images and GIFs

```md
![Two paddles bouncing a ball](./images/pong-preview.gif)
```

Paths are relative to the markdown file. Images are optimized at build time; animated GIFs stay animated.

### Downloads and links

```md
[Project at the end of chapter 1](./files/pong-ch1-end.zip)
[Next: moving the paddles](../02-paddles/01-paddle-scene.md#moving-with-input)
```

Relative links to files become download buttons (with file size). Relative links to other `.md` pages become site links. A link to a file that doesn't exist fails the build.

### Callouts

```md
:::tip
Short helpful aside.
:::

:::warning[Custom title]
Kinds: tip, note, info, warning, danger.
:::
```

### Quizzes

A fenced block with the language `quiz`, containing YAML:

````md
```quiz
question: Which node moves the paddle?
options:
  - CharacterBody2D
  - Sprite2D
answer: 0                # index of the right option (0-based)
explain: Shown after a correct answer.
hint: Optional; revealed by a "Hint" button.
```

```quiz
type: multiple           # pick all that apply
question: Which belong in `project.godot`?
options: [Viewport size, Main scene, Node positions]
answer: [0, 1]
```

```quiz
type: text               # free text, case- and whitespace-insensitive
question: Which method moves a CharacterBody2D?
answer: [move_and_slide, move_and_slide()]   # any of these is accepted
```
````

Question, options, hint and explanation support `` `code` ``, `**bold**` and `*italic*`. Each quiz's result is tracked under `<page id>#<n>` (the nth quiz on the page). Add `id: something` to keep a quiz's result stable when you insert quizzes above it. A malformed quiz fails the build with the file, quiz number and line.

## Project layout

| Path | What |
| --- | --- |
| `src/content.config.ts` | Content collections and frontmatter schemas |
| `src/lib/catalog.ts` | Builds the ordered tutorial → chapter → page tree, prev/next |
| `src/lib/remark/` | Markdown plugins: quizzes, callouts, relative links |
| `src/integrations/tutorial-files.ts` | Serves/copies tutorial files at `/files/…` |
| `src/lib/progress.ts` | localStorage progress store, export/import/merge |
| `src/scripts/quiz.ts` | Quiz interactivity |
| `src/pages/` | Routes: library, tutorial, chapter, page, progress |
