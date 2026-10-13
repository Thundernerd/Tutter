---
title: Track resources
description: A custom Resource type that describes a track, and loading the track at runtime.
estimatedMinutes: 20
---

So far the breakfast table is baked into `race.tscn`. With three tracks, the race scene should load whichever one was picked, and the menus need to list the tracks (name, description, lap record) **without** loading every track scene.

## A custom Resource

A **Resource** is Godot's data container: textures, shapes, curves and themes are all resources. You can make your own by extending `Resource`, and Godot then lets you create, edit and save them in the Inspector, just like built-in ones.

Create `track_info.gd`:

```gdscript title="track_info.gd"
class_name TrackInfo
extends Resource
## Everything the menus need to know about a track, without loading it.

## Used as the key for lap records, so don't change it once players have records.
@export var id := ""
@export var title := ""
@export_multiline var description := ""
@export var scene: PackedScene
```

Now create one: in the FileSystem dock, right-click the `tracks` folder → **New Resource**, search for `TrackInfo`, and save it as `tracks/breakfast.tres`. Fill it in the Inspector:

| Property | Value |
| --- | --- |
| Id | `breakfast` |
| Title | `Breakfast Table` |
| Description | `A gentle warm-up around the cereal bowl. Mind the orange juice.` |
| Scene | drag `tracks/breakfast.tscn` here |

Saved as `.tres`, it's a small readable text file:

```ini title="tracks/breakfast.tres"
[gd_resource type="Resource" script_class="TrackInfo" format=3]

[ext_resource type="Script" path="res://track_info.gd" id="1"]
[ext_resource type="PackedScene" path="res://tracks/breakfast.tscn" id="2"]

[resource]
script = ExtResource("1")
id = "breakfast"
title = "Breakfast Table"
description = "A gentle warm-up around the cereal bowl. Mind the orange juice."
scene = ExtResource("2")
```

:::note[Scenes or resources?]
We use both: the **scene** is the track itself (curve, props, spills), and the **resource** is a label on the box. Splitting them keeps each simple. An `id` separate from the title means you can rename "Breakfast Table" to "Brunch Table" later without losing everybody's lap records.
:::

## The track list

The Session autoload owns the list of tracks and which one is being raced:

```gdscript title="session.gd" ins={3-8,11-15}
enum Mode { RACE, CHAMPIONSHIP, HEAD_TO_HEAD }

const TRACKS: Array[TrackInfo] = [
	preload("res://tracks/breakfast.tres"),
	preload("res://tracks/desk.tres"),
	preload("res://tracks/pool.tres"),
]

var mode := Mode.RACE
var players := 1
var track_index := 0


func track() -> TrackInfo:
	return TRACKS[track_index]
```

The desk and pool resources come on the next page; comment those two lines out until then.

`preload` in a `const` loads the resources when the script loads. Each `TrackInfo` references its scene, so the scenes load too. For three small tracks that's nothing; a game with fifty tracks would store `scene` as a file path (`@export_file("*.tscn")`) and `load()` it on demand instead.

## Loading the track at runtime

In `race.tscn`, delete the `BreakfastTable` instance. The race creates the track itself:

```gdscript title="race.gd" ins={3,7,17-19} del={2,11}
extends Node2D
## Runs one race on the track in this scene.
## Runs one race, or one head-to-head match, on the track picked in Session.

# ...

var track: Track
var cars: Array[Car] = []

# ...
@onready var track: Track = $BreakfastTable
@onready var cars_node: Node2D = $Cars


func _ready() -> void:
	head_to_head = Session.mode == Session.Mode.HEAD_TO_HEAD
	track = Session.track().scene.instantiate()
	add_child(track)
	move_child(track, 0) # Draw the track below the cars.
	track.checkpoint_entered.connect(_on_checkpoint_entered)
	# ...
```

`move_child(track, 0)` makes the track the first child, so it's drawn first, under the cars. Everything else (spawning, the camera bounds, the checkpoints) already asks `track` for what it needs, so nothing else changes. That's the payoff of keeping track-specific knowledge inside `Track`.

## The track's name on the results

Add a `Subtitle` label (unique name, 70% opacity via **Modulate**, centred) under the results screen's `Title`:

```gdscript title="results.gd" ins={2,8,14}
@onready var title: Label = %Title
@onready var subtitle: Label = %Subtitle

# ...

func show_race(order: Array[Car]) -> void:
	title.text = "Race results"
	subtitle.text = Session.track().title
	# ...


func show_match_winner(winner: Car) -> void:
	title.text = "%s wins the match!" % winner.driver_name
	subtitle.text = "Head-to-head  ·  " + Session.track().title
	_start_table([])
	# ...
```

```quiz
question: Why does `TrackInfo` have an `id` as well as a `title`?
options:
  - Godot requires an id on every Resource
  - Lap records are stored by id, so the title can change without losing them
  - The id is shown in the menus
answer: 1
```

```quiz
question: The race adds the track with `add_child(track)`. What would happen without the `move_child(track, 0)` after it?
options:
  - Nothing; draw order doesn't depend on the tree
  - The track would be the last child, so it would draw on top of the cars
  - The checkpoints wouldn't work
answer: 1
explain: Siblings are drawn in tree order. `add_child` appends at the end, after `Cars`, so the table would cover every car.
```
