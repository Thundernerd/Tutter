---
title: Cells from code
description: map_to_local, local_to_map, reading and writing cells, and random blocks.
estimatedMinutes: 20
---

The arena needs a script that answers questions in **cells**: what's in this cell, which cell is this pixel in, where is the middle of that cell. The rest of the game (bombers, bombs, explosions, the CPU) will ask the arena instead of poking at tile layers directly.

## Map coordinates

A `TileMapLayer` has two coordinate systems:

- **local** coordinates, in pixels, relative to the layer's position
- **map** coordinates, in cells, as a `Vector2i`

Two methods convert between them:

```text
local_to_map(Vector2(40, 30))  →  Vector2i(1, 1)    # which cell contains this point
map_to_local(Vector2i(1, 1))   →  Vector2(36, 36)   # the CENTRE of that cell
```

`map_to_local` returning the *centre* is handy: bombs, bombers and monsters are all centred on their cells.

## Every node in one coordinate space

The layers sit at (0, 0) inside `Arena`. If everything that moves on the grid also lives inside `Arena` (in plain `Node2D` containers that stay at the origin), then a node's `position` *is* a layer-local position. That one rule means we never have to convert between global and local coordinates. We'll add those containers in the next chapter.

## Reading and writing cells

The TileMapLayer methods we'll use, all taking map coordinates:

| Method | Does |
| --- | --- |
| `get_cell_source_id(cell)` | The source id of the tile there, or `-1` if the cell is empty |
| `set_cell(cell, source_id, atlas_coords)` | Puts a tile in a cell |
| `erase_cell(cell)` | Empties a cell |
| `clear()` | Empties every cell |
| `get_used_cells()` | All non-empty cells, as an `Array[Vector2i]` |
| `get_used_rect()` | The smallest `Rect2i` around all used cells |

## The script

Attach a script to `Arena`:

```gdscript title="arena.gd"
class_name Arena
extends Node2D
## The playing field. Owns the tile layers and knows what is in every cell.
##
## Every gameplay node lives inside the arena, in containers at its origin,
## so a node's `position` and the tile layers share one coordinate space.

const SOURCE_ID := 0
const BLOCK_TILE := Vector2i(2, 0)

## Chance that a free floor cell starts with a block on it.
@export_range(0.0, 1.0) var block_density := 0.7

@onready var floor_layer: TileMapLayer = $Floor
@onready var walls: TileMapLayer = $Walls
@onready var blocks: TileMapLayer = $Blocks


## The cell containing a point in arena coordinates.
func cell_at(point: Vector2) -> Vector2i:
	return walls.local_to_map(point)


## The centre of a cell, in arena coordinates.
func cell_center(cell: Vector2i) -> Vector2:
	return walls.map_to_local(cell)


func is_wall(cell: Vector2i) -> bool:
	return walls.get_cell_source_id(cell) != -1


func is_block(cell: Vector2i) -> bool:
	return blocks.get_cell_source_id(cell) != -1


## Can a bomber or monster walk into this cell?
func is_free(cell: Vector2i) -> bool:
	return not is_wall(cell) and not is_block(cell)


## The four corners where bombers start: top-left, bottom-right, top-right, bottom-left.
func spawn_cells() -> Array[Vector2i]:
	var area := floor_layer.get_used_rect()
	var first := area.position
	var last := area.end - Vector2i.ONE
	return [first, last, Vector2i(last.x, first.y), Vector2i(first.x, last.y)]


## Fill the arena with fresh blocks, leaving room around the spawn corners.
func generate() -> void:
	blocks.clear()
	var spawns := spawn_cells()
	for cell in floor_layer.get_used_cells():
		if is_wall(cell) or _near_any(cell, spawns, 1) or randf() > block_density:
			continue
		blocks.set_cell(cell, SOURCE_ID, BLOCK_TILE)


func _near_any(cell: Vector2i, others: Array[Vector2i], steps: int) -> bool:
	for other in others:
		if absi(cell.x - other.x) + absi(cell.y - other.y) <= steps:
			return true
	return false
```

Things worth a closer look:

- **`class_name Arena`** registers a global type. Other scripts can write `var arena: Arena` and get autocompletion for `cell_at`, `is_free` and the rest.
- **`spawn_cells`** doesn't hard-code `(1, 1)` and `(15, 11)`. It asks the floor layer for its used rectangle, so a bigger arena would just work. `Rect2i.end` is one past the last cell, hence the `- Vector2i.ONE`.
- **`_near_any`** measures the *Manhattan distance*: steps along the grid, no diagonals. `<= 1` keeps each spawn cell and its neighbours clear, so every bomber has room to place a first bomb and step aside.
- **`randf() > block_density`** skips about 30% of the cells, so the arena has some open floor.
- Using `walls` for `cell_at` and `cell_center` is arbitrary: all three layers share the same position and tile size, so any of them gives the same answer.

:::warning[`-1` means empty]
`get_cell_source_id` returns `-1` for an empty cell, not `0`. Our only atlas *is* source 0, so checking `!= 0` would get every answer backwards.
:::

## Generate on start

Give `Game` a script:

```gdscript title="game.gd"
extends Node2D

@onready var arena: Arena = $Arena


func _ready() -> void:
	arena.generate()
```

Run it a few times: every run has a new block layout, with open corners for the bombers. Godot seeds its random number generator at startup, so `randf()` differs from run to run.

```quiz
question: With 24×24 tiles, what does `map_to_local(Vector2i(2, 1))` return?
type: text
answer: ["(60, 36)", "Vector2(60, 36)", "60, 36", "(60,36)", "60,36"]
hint: Cell 2 starts at x = 48. Where's its centre?
explain: x = 2 × 24 + 12 = 60, y = 1 × 24 + 12 = 36. `map_to_local` returns the centre of the cell.
```

```quiz
question: Which cell does `local_to_map(Vector2(47.9, 24))` return, with 24×24 tiles?
options:
  - (2, 1)
  - (1, 1)
  - (1, 0)
  - (2, 0)
answer: 1
explain: 47.9 / 24 = 1.99 rounds *down* to 1, and 24 / 24 = 1 exactly, so the point is in cell (1, 1).
```
