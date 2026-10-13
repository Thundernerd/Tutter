---
title: The board
summary: A grid of cells in a plain data model, a board that draws it, and mouse input.
---

The most important decision in this game is made before a single mine exists: the rules and the visuals live in **separate scripts**.

```text
 click ──► Board (Control) ──── calls ────► BoardModel (rules)
              ▲                                   │
              └──────── reads and draws ◄─────────┘
```

| Script | Knows about | Doesn't know about |
| --- | --- | --- |
| `BoardModel` | cells, mines, numbers, flags, winning and losing | nodes, pixels, mice, colours |
| `Board` | pixels, colours, mouse and keyboard input | how mines are placed, what a flood fill is |

Why bother? The model is a plain object, so you could test the rules from a script without opening a window, run the same rules behind a completely different look, or let an AI play by calling the same methods the mouse does. And when something goes wrong, you know where to look: wrong numbers are a model bug, wrong colours are a board bug.
