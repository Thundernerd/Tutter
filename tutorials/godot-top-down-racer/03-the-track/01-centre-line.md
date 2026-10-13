---
title: The centre line
description: A closed Path2D, Curve2D offsets, and the track script's first helpers.
estimatedMinutes: 20
---

## The track scene

Create a folder called `tracks` in the FileSystem dock. Make a new scene with a `Node2D` root named `BreakfastTable`, add a `Path2D` child named `Path`, and save it as `tracks/breakfast.tscn`.

```text
BreakfastTable (Node2D)   # position (0, 0)
└── Path (Path2D)         # position (0, 0)
```

:::warning[Keep both at (0, 0)]
The track's maths uses the curve's coordinates directly as world coordinates. That only works while the track and its path sit at the origin, so don't move them. Move the curve's points instead.
:::

## Drawing the curve

Select `Path` and, in the Inspector, create a **New Curve2D** for its **Curve** property. The 2D toolbar now shows path tools:

| Tool | Does |
| --- | --- |
| Select Points | Drag points around. Shift-drag from a point to pull out its handles. |
| Select Control Points | Drag the handles that bend the curve between points. |
| Add Point | Click to add a point at the end of the curve. |
| Close Curve | Adds a final point on top of the first, closing the loop. |

The breakfast table is 1200×700 pixels, and the track runs anticlockwise around it. Add points at these positions, in this order, then click **Close Curve**:

```text
(560, 600)  (860, 610)  (1060, 560) (1120, 420)
(1060, 300) (1080, 170) (980, 90)   (800, 110)
(680, 220)  (540, 250)  (420, 140)  (260, 90)
(130, 170)  (110, 330)  (180, 480)  (330, 590)
```

Straight lines between points make terrible corners, so give each point handles to smooth it out: about a third of the distance to its neighbours, pointing along the road. Don't aim for perfection; any smooth loop that doesn't cross itself works. (If you'd rather paste the exact curve, open `tracks/breakfast.tscn` from the [complete project](../13-ship-it/files/tiny-racers-complete.zip) in a text editor and copy its `Curve2D` sub-resource.)

The first point is special: it's where the **start/finish line** goes, and the order of the points sets the **racing direction**.

:::tip
Keep at least two road widths (about 120 px) between parts of the curve that run side by side. Otherwise the roads overlap and the "closest point on the curve" can jump to the wrong stretch.
:::

## Offsets: distance along the curve

Godot turns the curve into a chain of points about 5 px apart (the curve's **Bake Interval**). From then on, any spot on the curve can be described by one number: its **offset**, the distance along the curve from the first point. Offset 0 is the start line, and `get_baked_length()` is a full lap.

Two curve methods do most of the work in this game:

| Method | Answers |
| --- | --- |
| `get_closest_offset(point)` | How far along the track is this position? |
| `sample_baked_with_rotation(offset)` | Where is the road at this offset, and which way does it point? |

The second one returns a `Transform2D`: its `origin` is the point on the curve, its `x` axis points along the road in the racing direction, and its `y` axis points to the road's right-hand side.

## The track script

Attach a script to `BreakfastTable` and save it as `track.gd` (in the project root, not in `tracks/`: every track will share it):

```gdscript title="track.gd"
class_name Track
extends Node2D
## A race track built around a closed Path2D centre line.

@export var road_width := 60.0
@export var kerb_width := 6.0

var curve: Curve2D
var length := 0.0

@onready var path: Path2D = $Path


func _ready() -> void:
	curve = path.curve
	length = curve.get_baked_length()


## Distance along the centre line (0 to `length`) of the point closest to `point`.
func offset_at(point: Vector2) -> float:
	return curve.get_closest_offset(point)


## Position and direction on the centre line: `origin` is the point, `x` points
## along the road in the racing direction and `y` points to its right-hand side.
func transform_at(offset: float) -> Transform2D:
	return curve.sample_baked_with_rotation(wrapf(offset, 0.0, length), true)
```

`wrapf(offset, 0.0, length)` lets callers ask for any offset, even negative ones or ones past the end: `transform_at(-36)` means "36 px *before* the line", and `transform_at(length + 10)` is the same as `transform_at(10)`. That's handy on a loop, and the starting grid in the laps chapter relies on it. The `true` asks for cubic interpolation, which is smoother between baked points.

```quiz
question: The track is 2800 px long. What does `transform_at(-100).origin` return?
options:
  - The point 100 px before the start line, at offset 2700
  - The first point of the curve, because negative offsets are clamped
  - An error
answer: 0
explain: '`wrapf(-100, 0, 2800)` is 2700, so you get the point 100 px before the line, which is just where a starting grid belongs.'
```

```quiz
question: Which `Curve2D` method tells you how far along the track a car is?
type: text
answer: [get_closest_offset, get_closest_offset(), curve.get_closest_offset]
```
