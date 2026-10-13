---
title: The bomber scene
description: A CharacterBody2D with an AnimatedSprite2D built from a sprite sheet.
estimatedMinutes: 20
---

## Nodes

Create a new scene with a `CharacterBody2D` root named `Bomber`:

```text
Bomber (CharacterBody2D)     # Motion Mode: Floating, group "bombers"
├── CollisionShape2D         # RectangleShape2D, 18×18
└── AnimatedSprite2D         # SpriteFrames from art/bomber.png
```

| Property | Value | Why |
| --- | --- | --- |
| Motion Mode | `Floating` | *Grounded* is for platformers with floors and slopes |
| Collision → Layer | `bombers` | What a bomber *is* |
| Collision → Mask | `solid`, `bombs` | Walls, blocks and (later) bombs stop it |
| Groups (Node dock) | `bombers` | So bombs and the CPU can find every bomber |

The collision box is **18×18**, smaller than the 24-pixel corridors. That 3 pixels of slack on each side matters in a moment.

## Animations from a sprite sheet

`art/bomber.png` is a 3×3 sheet. Each row is a direction; each column a pose:

| Row | Facing | Columns |
| --- | --- | --- |
| 0 | down | stand, left foot, right foot |
| 1 | up | stand, left foot, right foot |
| 2 | sideways (right) | stand, left foot, right foot |

Select the `AnimatedSprite2D`, create a **New SpriteFrames** in its **Sprite Frames** property, and click it to open the **SpriteFrames** panel at the bottom.

1. Rename the `default` animation to `walk_down`.
2. Click **Add frames from sprite sheet** (the grid icon), open `art/bomber.png`, set the grid to **3 × 3**, click the three frames of row 0, and add them.
3. Copy the first frame and paste it in third place, so the order is *stand, step, stand, other step*: a four-frame walk cycle that passes through the standing pose.
4. Set the speed to **8 FPS** and keep **Loop** on.
5. Add `walk_up` (row 1) and `walk_side` (row 2) the same way.

Frame 0 of every animation is the standing pose. We'll rely on that: stopping an animation resets it to frame 0, so a bomber that stops walking stands still facing the right way. There's no separate "walk left" row, because flipping `walk_side` horizontally does the job.

Save the scene as `bomber.tscn`.

## Containers in the arena

Bombers will live inside the arena, so their `position` is in the same coordinate space as the tiles. Open `arena.tscn` and add four plain `Node2D` children *after* the tile layers, in this order:

```text
Arena (Node2D)
├── Floor, Walls, Blocks (TileMapLayer)
├── PowerUps (Node2D)
├── Bombs (Node2D)
├── Actors (Node2D)     # bombers and monsters
└── Flames (Node2D)
```

Nodes later in the tree draw on top, so this order is also the drawing order: power-ups under bombs, bombs under bombers, and flames over everything. Leave the containers at (0, 0).

Give `arena.gd` a reference to the one we need now:

```gdscript title="arena.gd" ins={4}
@onready var floor_layer: TileMapLayer = $Floor
@onready var walls: TileMapLayer = $Walls
@onready var blocks: TileMapLayer = $Blocks
@onready var actors: Node2D = $Actors
```

```quiz
question: Why does the bomber's collision box measure 18×18 when a corridor is 24 pixels wide?
options:
  - Godot requires bodies to be smaller than tiles
  - A slightly smaller box can pass through corridors without scraping every wall
  - So the sprite can stick out for decoration
answer: 1
explain: An exactly tile-sized box would touch both walls of a corridor at once. A little slack lets it move freely, and the lane code we'll write keeps it centred.
```
