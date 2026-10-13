---
title: The tileset
description: A generated wall tileset, and how a wall picks the right picture for its neighbours.
estimatedMinutes: 20
---

## Get the art

Download the art used in this tutorial: [maze-muncher-art.zip](./files/maze-muncher-art.zip). Unzip it into your project so you have an `art/` folder:

| File | Contains |
| --- | --- |
| `tiles.png` | 256 wall pieces, a pellet, a power pellet and the ghost door, all 10×10 |
| `player.png` | 3 frames of the player chomping, 14×14 each |
| `player_death.png` | 11 frames of the death animation |
| `ghost.png` | ghost bodies: normal (white), frightened (blue), flashing (pale) |
| `ghost_eyes.png` | eyes looking right, down, left and up |
| `fruit.png` | five bonus fruits |

Everything was drawn by a Python script using the Pillow library, which is also in the zip (`make_art.py`). You don't need to run it, but it's a good place to start if you'd like to change the colours or draw your own maze style.

## How the walls work

Look at `tiles.png` and you'll see the top 16 rows hold 256 slightly different wall pieces. A wall in the maze isn't one picture; it's drawn tile by tile, and each tile must connect to its neighbours: a straight edge here, a rounded outer corner there, an inner corner somewhere else.

Each wall tile looks at its **eight neighbours** and asks "is that a wall too?" Eight yes/no answers make an 8-bit number, the **mask**, from 0 to 255:

```text
 NW 128 │  N 1  │ NE 16
────────┼───────┼────────
  W 8   │ wall  │  E 2
────────┼───────┼────────
 SW 64  │  S 4  │ SE 32
```

A wall with walls to the north and south only has mask `1 + 4 = 5`: a vertical wall segment with an outline on both sides. A wall surrounded by walls on all sides has mask `255` and is drawn as plain fill.

The script drew one picture for every possible mask and laid them out in order: mask *m* is in column `m % 16`, row `m / 16`. So "which picture?" is a two-line calculation, which we'll write in the next page.

:::note[What about terrains?]
Godot has built-in autotiling called **terrains**: you paint which edges of each tile connect, and the TileMap picks tiles for you. It's great for hand-painted levels. Here the maze comes from text and the tileset from a script, so doing the lookup ourselves is simpler than configuring terrain bits for dozens of tiles by hand.
:::

## Create the TileSet

1. Create a new scene with a `Node2D` root named `Maze`, and save it as `maze.tscn`.
2. Add a `TileMapLayer` child named `Walls`.
3. In the Inspector, set its **Tile Set** to **New TileSet**, click the new resource, and set **Tile Size** to `10 × 10`.
4. Open the **TileSet** panel at the bottom of the editor and drag `art/tiles.png` into its sources list. When Godot offers to **automatically create tiles** in the atlas, click **Yes**.
5. Back in the Inspector, click the arrow next to **Tile Set** and choose **Save As…** → `tiles.tres`. Saving the TileSet as its own file lets the next two layers share it.

The tile at atlas coordinates `(0, 16)` is the pellet, `(1, 16)` the power pellet and `(2, 16)` the ghost door.

:::tip
Every wall tile has at least a few non-transparent pixels (even mask 255 is filled with dark blue). That's on purpose: Godot only auto-creates tiles where the texture isn't empty.
:::

```quiz
question: A wall tile has walls to its west and east, and nowhere else. What is its mask?
type: text
answer: ["10"]
hint: W is 8 and E is 2.
explain: 8 + 2 = 10, a horizontal wall segment. It's in column 10, row 0 of `tiles.png`.
```

```quiz
question: Which atlas coordinates hold the picture for mask 37?
options:
  - (5, 2)
  - (2, 5)
  - (3, 7)
answer: 0
explain: Column `37 % 16 = 5`, row `37 / 16 = 2` (integer division).
```
