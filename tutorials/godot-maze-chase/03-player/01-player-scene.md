---
title: The player scene
description: An AnimatedSprite2D from a sprite sheet, and a base class for everything that moves in the maze.
estimatedMinutes: 20
---

## No physics this time

In a platformer or in Pong you'd reach for `CharacterBody2D` and let the physics engine handle collisions. A maze game is different: the player never slides along a wall or bounces off anything. It moves along corridors exactly one tile wide and turns only at tile centres. All the "collision" we need is a question to the maze: *is that cell open?*

So the player and the ghosts are plain `Node2D`s that move themselves, and the walls have no collision shapes at all.

## The scene

Create a new scene with a `Node2D` root named `Player`, and save it as `player.tscn`:

```text
Player (Node2D)
└── Sprite (AnimatedSprite2D)
```

An `AnimatedSprite2D` plays a sequence of frames from a **SpriteFrames** resource. Select `Sprite`, set **Sprite Frames** to **New SpriteFrames**, and click it to open the **SpriteFrames** panel at the bottom:

1. Rename the `default` animation to `move`.
2. Click **Add frames from a Sprite Sheet** (the grid icon), open `art/player.png`, and set the grid to **3** horizontal, **1** vertical. Select all three frames and press **Add 3 Frames**.
3. Open the same dialog once more, select only the middle frame, and add it. New frames go to the end, so the animation is now closed, half, open, half, and loops back to closed: a smooth chomp.
4. Set the animation speed to `16` FPS and leave **Loop** on.

The sprite is 14×14 pixels, a bit bigger than a 10×10 tile, so the player overlaps the walls slightly. That's how the arcade games looked too: the actors are drawn on top of the maze, centred on their tile.

:::tip
Godot positions a sprite by its centre (**Centered** is on by default), so a player at the centre of a cell is drawn neatly over it.
:::

## A base class for everything that moves

The player and the four ghosts all move the same way: from tile centre to tile centre, deciding where to go at each centre. That shared part goes in a script of its own, `actor.gd`, which the player and the ghost scripts will **extend**:

```gdscript title="actor.gd"
class_name Actor
extends Node2D
## Something that moves through the maze from tile centre to tile centre:
## the player and the ghosts both extend this script.

@export var maze: Maze

var direction := Vector2i.ZERO
## The maze cell the actor's centre is in.
var cell: Vector2i:
	get:
		return maze.pos_to_cell(position)
```

Don't attach `actor.gd` to anything. It's a base for other scripts.

- **`@export var maze: Maze`** lets you pick the maze node in the Inspector. Because `Maze` is a `class_name`, the Inspector only accepts nodes with the maze script.
- **`direction`** is a `Vector2i`: one of `Vector2i.UP`, `DOWN`, `LEFT`, `RIGHT`, or `ZERO` when standing still. Integer vectors fit grid movement: no rounding surprises, and `cell + direction` is the neighbouring cell.
- **`cell`** is a property with a **getter**: reading `cell` runs the code below `get:`, so it's always up to date with `position` and never needs storing.

```quiz
question: Why do the player and the ghosts extend `Node2D` instead of `CharacterBody2D`?
options:
  - CharacterBody2D doesn't work with TileMapLayer
  - They move along a grid and only need to ask the maze which cells are open, so physics adds nothing
  - Node2D is faster to draw
answer: 1
```

```quiz
question: What happens each time code reads `cell` on an actor?
options:
  - It returns a value stored when the actor last moved
  - The getter runs and converts the current position to a cell
  - It reads the cell from the TileMapLayer
answer: 1
```
