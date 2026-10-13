---
title: Lap records
description: Saving the best lap on every track, announcing new records, and clearing them.
estimatedMinutes: 15
---

A lap record gives a reason to replay a track on your own: beat your best. Records belong next to the settings: they're saved per user and survive restarts.

## Storing records

```gdscript title="settings.gd" ins={3-4,8-23,31-32,38-41}
## 0 = easy, 1 = normal, 2 = hard.
var cpu_difficulty := 1
## Best lap time per track id, in seconds.
var best_laps := {}

# ...

func get_best_lap(track_id: String) -> float:
	return best_laps.get(track_id, INF)


## Remember a lap time if it beats the record. Returns true for a new record.
func submit_lap(track_id: String, time: float) -> bool:
	if time >= get_best_lap(track_id):
		return false
	best_laps[track_id] = time
	save_settings()
	return true


func clear_records() -> void:
	best_laps.clear()
	save_settings()

# ...

func save_settings() -> void:
	# ...
	for action in REBINDABLE_ACTIONS:
		config.set_value("controls", action, get_key(action))
	for track_id in best_laps:
		config.set_value("records", track_id, best_laps[track_id])
	config.save(SAVE_PATH)


func load_settings() -> void:
	# ...
	best_laps.clear()
	if config.has_section("records"):
		for track_id in config.get_section_keys("records"):
			best_laps[track_id] = config.get_value("records", track_id)
```

- Records are keyed by the track's **id** (`"breakfast"`), not its title, as planned in the tracks chapter.
- A track with no record returns `INF`, so *any* lap beats it, and `Format.time` shows `INF` as `-:--.--`.
- A new record is saved straight away. It happens a few times per race at most, and it would be a shame to lose one because the game crashed before you reached the options screen.

The saved file gains a section like this:

```ini title="settings.cfg"
[records]

breakfast=14.37
desk=21.05
```

## Announce it

Only players set records (a CPU lap record would be no fun). In `race.gd`:

```gdscript title="race.gd" ins={6-8}
func _complete_lap(car: Car) -> void:
	var lap_time := race_time - car.lap_start_time
	car.lap_start_time = race_time
	car.best_lap = minf(car.best_lap, lap_time)
	car.lap += 1
	if car.is_player():
		if Settings.submit_lap(Session.track().id, lap_time):
			hud.show_message("Lap record!", 1.5)
	if not head_to_head and car.lap > Settings.laps:
		_finish(car)
```

## Show it, clear it

On the new game screen, add a fourth row to the grid: a `Label` "Lap record" and a `RecordLabel` (unique name). Then show the selected track's record:

```gdscript title="mode_select.gd" ins={1,10}
@onready var record_label: Label = %RecordLabel

# ...

func _refresh() -> void:
	var mode := mode_option.selected as Session.Mode
	var info := Session.TRACKS[track_option.selected]
	# A championship always runs every track, in order.
	track_option.disabled = mode == Session.Mode.CHAMPIONSHIP
	record_label.text = Format.time(Settings.get_best_lap(info.id))
	# ...
```

Because `_refresh()` runs whenever any dropdown changes, the record updates as you flip through the tracks.

Finally, a way to start over: a `ClearRecordsButton` (unique name, text "Clear lap records") under the settings grid in the options screen's `SettingsColumn`, with its `pressed` signal connected:

```gdscript title="options_menu.gd" ins={1,8,13-16}
@onready var clear_records_button: Button = %ClearRecordsButton

# ...

func _ready() -> void:
	# ...
	difficulty_option.selected = Settings.cpu_difficulty
	clear_records_button.disabled = Settings.best_laps.is_empty()
	_build_controls()
	master_slider.grab_focus()


func _on_clear_records_button_pressed() -> void:
	Settings.clear_records()
	clear_records_button.text = "Records cleared"
	clear_records_button.disabled = true
```

Disabling the button when there's nothing to clear is a small kindness: you can see at a glance that there are no records.

```quiz
question: A track has no record yet. What does `Settings.get_best_lap("pool")` return?
type: text
answer: [INF, inf, infinity]
explain: The dictionary has no "pool" key, so `get` returns its default, `INF`. Any real lap time is smaller, so the first lap on a track is always a record.
```

```quiz
question: Why are records stored by the track's id instead of its title?
options:
  - Titles can contain spaces, which ConfigFile can't store
  - So renaming a track's title doesn't lose its records
  - Ids sort better
answer: 1
```
