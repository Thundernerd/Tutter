---
title: The scoreboard
description: A HUD built from code, a round clock, and greying out the fallen.
estimatedMinutes: 20
---

The 48-pixel strip above the arena gets a scoreboard: one slot per bomber with their icon and wins, and a clock in the middle.

## An icon from the sprite sheet

The slots show each bomber's standing frame. Rather than cutting a separate PNG, make an **AtlasTexture**: a texture that shows a region of another texture. In the FileSystem dock, **Create New → Resource… → AtlasTexture**, set its **Atlas** to `art/bomber.png` and its **Region** to `(0, 0, 24, 24)`, and save it as `bomber_icon.tres`. It works anywhere a texture does.

## The HUD scene

UI goes on a `CanvasLayer`, which draws in screen space: it ignores the camera, which matters once we shake it.

```text
HUD (CanvasLayer)
└── Bar (HBoxContainer)              # Anchor preset Top Wide; offsets left 12, right -12, bottom 48
    ├── LeftSlots (HBoxContainer, %)     # Expand, separation 16
    ├── TimeLabel (Label, %)             # min width 96, font size 24, centred, text "2:00"
    └── RightSlots (HBoxContainer, %)    # Expand, separation 16, Alignment End
```

**Expand** (in *Container Sizing → Horizontal*) on both slot boxes makes them share the leftover width equally, which keeps the clock in the middle. Right-click the three nodes marked `%` and choose **Access as Unique Name**, so the script can find them with `%LeftSlots` no matter how the layout changes.

```gdscript title="hud.gd"
extends CanvasLayer
## The bar above the arena: every bomber's wins, and the round clock.

const BOMBER_ICON := preload("res://bomber_icon.tres")

var _slots: Array[Control] = []

@onready var left_slots: HBoxContainer = %LeftSlots
@onready var right_slots: HBoxContainer = %RightSlots
@onready var time_label: Label = %TimeLabel


## Build one slot per bomber: even indices on the left, odd on the right.
func setup(bombers: Array[Dictionary], wins: Array[int]) -> void:
	for i in bombers.size():
		var icon := TextureRect.new()
		icon.texture = BOMBER_ICON
		icon.self_modulate = bombers[i].color
		icon.stretch_mode = TextureRect.STRETCH_KEEP_CENTERED
		var label := Label.new()
		label.text = "%s\nWins: %d" % [bombers[i].name, wins[i]]
		var slot := HBoxContainer.new()
		slot.add_child(icon)
		slot.add_child(label)
		(left_slots if i % 2 == 0 else right_slots).add_child(slot)
		_slots.append(slot)


func mark_dead(index: int) -> void:
	_slots[index].modulate.a = 0.35


func show_time(seconds: float) -> void:
	var whole := ceili(seconds)
	time_label.text = "%d:%02d" % [floori(whole / 60.0), whole % 60]


func show_hurry() -> void:
	time_label.text = "HURRY!"
	time_label.modulate = Color(1, 0.4, 0.3)
```

- Slots are built from code because the number of bombers depends on the mode. Even indices go left, odd ones right, so in a two-player match P1 is on the left and P2 on the right.
- `stretch_mode = STRETCH_KEEP_CENTERED` stops the icon from being stretched to the bar's full 48-pixel height.
- `(left_slots if i % 2 == 0 else right_slots).add_child(slot)`: a conditional expression can pick the object to call a method on.
- `floori(whole / 60.0)` divides as floats and rounds down. Writing `whole / 60` would work too, but Godot warns about integer division because it silently drops the remainder.

Save it as `hud.tscn` and instance it in `game.tscn`.

## The round clock

Rounds get a time limit, so two careful players can't hide forever. Add a `Timer` named `RoundTimer`: **Wait Time** `120`, **One Shot** on, `timeout` connected to `Game`.

```gdscript title="game.gd" ins={2-3,11-12,15-17,20-21,27,31-32}
@onready var arena: Arena = $Arena
@onready var hud: CanvasLayer = $HUD
@onready var round_timer: Timer = $RoundTimer
@onready var settle_timer: Timer = $SettleTimer


func _ready() -> void:
	arena.generate()
	_spawn_bombers()
	_spawn_monsters()
	hud.setup(Match.bombers, Match.wins)
	round_timer.start()


func _process(_delta: float) -> void:
	if not round_timer.is_stopped():
		hud.show_time(round_timer.time_left)


func _on_bomber_died(bomber: Bomber) -> void:
	hud.mark_dead(bomber.index)
	# ...


func _end_round(winner: int) -> void:
	round_over = true
	round_timer.stop()
	# ...


func _on_round_timer_timeout() -> void:
	_end_round(-1) # Time's up: nobody wins.
```

`Timer.time_left` counts down by itself, so the HUD only has to display it. `is_stopped()` keeps the clock frozen once the round is over. Being a node inside the game scene, the round timer also pauses with the game and resets with every reload.

Run a round: the clock ticks down, dead bombers fade in the scoreboard, and the next round shows the updated wins.

```quiz
question: What does `hud.show_time(61.2)` display?
type: text
answer: ["1:02"]
hint: ceili rounds up first.
explain: ceili(61.2) = 62 seconds, which is 1 minute and 2 seconds.
```

```quiz
question: Why is the scoreboard on a CanvasLayer?
options:
  - Labels only render on CanvasLayers
  - It draws in screen space, so it stays put when the camera shakes
  - CanvasLayers are required for HBoxContainers
answer: 1
```
