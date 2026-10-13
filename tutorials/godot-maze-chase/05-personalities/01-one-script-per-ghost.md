---
title: One script per ghost
description: Extend the ghost script and override a single function per personality.
estimatedMinutes: 15
---

All four ghosts share the scene, the sprite, the movement rule and (soon) the modes. They differ in one function: `get_chase_target()`. That's a textbook case for **inheritance**: each ghost gets a tiny script that `extends Ghost` and overrides just that function.

## Ember, the chaser

Create `ember.gd`:

```gdscript title="ember.gd"
extends Ghost
## Ember, the red ghost: the chaser. Always heads straight for the player.


func get_chase_target() -> Vector2i:
	return player.cell
```

This is the same as the default in `ghost.gd`, so Ember behaves exactly as before. Writing it out anyway keeps the four personalities side by side, each in its own file, and makes it obvious where to look.

## Swapping the script on an instance

Select the `Ember` instance in `game.tscn`. In the Inspector, at the very bottom, drag `ember.gd` from the FileSystem dock onto **Script** (or click the dropdown → **Load**). The instance now uses `ember.gd` instead of the scene's `ghost.gd`.

Because `ember.gd` extends `Ghost`, nothing is lost: the exported `Color`, `Maze`, `Player` and `Speeds` are all still there, with the values you set.

:::note[How overriding works]
`_choose_direction()` in `ghost.gd` calls `get_target()`, which calls `get_chase_target()`. GDScript looks that function up on the actual object, so on Ember it finds `ember.gd`'s version first. The base class decides *when* to ask; the subclass decides *what* the answer is.
:::

## Three more ghosts

Instance `ghost.tscn` three more times under `Ghosts`, and create `rosie.gd`, `frost.gd` and `pumpkin.gd` the same way (each `extends Ghost`; we'll fill them in on the next pages). For now, give them `get_chase_target()` functions that return `player.cell` too.

| Instance | Script | Color | Position (for now) |
| --- | --- | --- | --- |
| `Ember` | `ember.gd` | `#ff2619` red | (140, 115) |
| `Rosie` | `rosie.gd` | `#ff99d9` pink | (100, 115) |
| `Frost` | `frost.gd` | `#33f2ff` cyan | (180, 115) |
| `Pumpkin` | `pumpkin.gd` | `#ff9926` orange | (140, 175) |

Don't forget to assign **Maze** and **Player** on each one. The positions are temporary: in the next chapter three of them move into the ghost house. Rosie and Frost start on row 11, on the line between two cells, just like Ember; Pumpkin starts on row 17, below the house.

Run the game. With four ghosts all chasing your tile, you'll notice something: after a few corners they line up behind each other in a conga line. The same target means the same choices, so they end up on the same path. Different targets fix that.

```quiz
question: The `Rosie` instance uses `rosie.gd`, which extends `Ghost`. `_choose_direction()` (defined in `ghost.gd`) calls `get_chase_target()`. Which version runs?
options:
  - The one in `ghost.gd`, because that's where `_choose_direction` is
  - The one in `rosie.gd`, because the object is a Rosie
  - Both, base first
answer: 1
```
