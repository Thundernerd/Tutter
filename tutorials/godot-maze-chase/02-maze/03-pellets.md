---
title: Pellets
description: Two more TileMapLayers for pellets, a blinking power pellet, and eating.
estimatedMinutes: 15
---

Pellets get eaten, walls don't. Keeping them on their own **layers** means eating a pellet is just erasing a tile, and the walls are never touched.

## Two more layers

Add two `TileMapLayer` children to `Maze`, after `Walls`, and give both the `tiles.tres` TileSet (drag it from the FileSystem dock onto **Tile Set**):

```text
Maze (Node2D)
├── Walls (TileMapLayer)
├── Pellets (TileMapLayer)
├── PowerPellets (TileMapLayer)
└── BlinkTimer (Timer)        # Wait Time 0.25, Autostart on
```

Power pellets get a layer of their own so they can blink: the arcade machines flashed them to catch your eye, and toggling one layer's `visible` does exactly that. Connect `BlinkTimer`'s `timeout` signal to `Maze`.

## Placing and eating pellets

Add these to `maze.gd`:

```gdscript title="maze.gd"
enum Pellet { NONE, NORMAL, POWER }

## Atlas coordinates in tiles.png.
const PELLET_TILE := Vector2i(0, 16)
const POWER_TILE := Vector2i(1, 16)

var pellets_left := 0
var pellets_total := 0

@onready var pellets: TileMapLayer = $Pellets
@onready var power_pellets: TileMapLayer = $PowerPellets


func reset_pellets() -> void:
	pellets.clear()
	power_pellets.clear()
	pellets_left = 0
	for y in grid_size.y:
		for x in grid_size.x:
			var cell := Vector2i(x, y)
			match _char_at(cell):
				".":
					pellets.set_cell(cell, 0, PELLET_TILE)
					pellets_left += 1
				"o":
					power_pellets.set_cell(cell, 0, POWER_TILE)
					pellets_left += 1
	pellets_total = pellets_left


## Removes the pellet at `cell`, if there is one, and says what it was.
func eat_pellet(cell: Vector2i) -> Pellet:
	if pellets.get_cell_source_id(cell) != -1:
		pellets.erase_cell(cell)
		pellets_left -= 1
		return Pellet.NORMAL
	if power_pellets.get_cell_source_id(cell) != -1:
		power_pellets.erase_cell(cell)
		pellets_left -= 1
		return Pellet.POWER
	return Pellet.NONE


func _on_blink_timer_timeout() -> void:
	power_pellets.visible = not power_pellets.visible
```

and call `reset_pellets()` at the end of `_ready`:

```gdscript title="maze.gd" ins={5}
func _ready() -> void:
	_rows = LAYOUT.strip_edges().split("\n")
	grid_size = Vector2i(_rows[0].length(), _rows.size())
	_build_walls()
	reset_pellets()
```

- **`reset_pellets`** is separate from `_ready` because we'll call it again at the start of every level.
- **`get_cell_source_id(cell)`** returns `-1` for an empty cell, so it doubles as "is there a tile here?".
- **`eat_pellet`** returns an **enum** value instead of a bool, because the caller needs to know *what* was eaten: a normal pellet is worth 10 points, a power pellet 50 and it frightens the ghosts.
- **`pellets_left`** is how we'll know the level is cleared: when it reaches 0.

:::note[Enums are named integers]
`enum Pellet { NONE, NORMAL, POWER }` is shorthand for three constants, 0, 1 and 2, grouped under a name. Outside the script you write `Maze.Pellet.POWER`, and using `Pellet` as a return type tells readers (and the editor) which values to expect.
:::

Run the game: the maze is now full of pellets, and the four power pellets in the corners blink.

```quiz
question: Why do the power pellets live on their own layer?
options:
  - TileMapLayers can only hold one kind of tile
  - So they can blink by toggling the whole layer's visibility
  - Power pellets are bigger than a tile
answer: 1
```

```quiz
question: What does `eat_pellet` return for a cell with no pellet?
type: text
answer: ["Pellet.NONE", "NONE", "Maze.Pellet.NONE", "0"]
```
