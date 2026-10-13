---
title: Playing with the keyboard
description: Input actions, a cursor that the mouse and keys share, and a restart key.
estimatedMinutes: 20
---

Minesweeper is a mouse game, but a keyboard cursor makes it playable on a laptop trackpad, more accessible, and it gives the options screen something to rebind later.

## Input actions

Code could check for the <kbd>Space</kbd> key directly, but then rebinding keys would mean changing code. Instead, Godot lets you define **input actions**: named controls like `reveal` that one or more keys map to.

Open **Project → Project Settings → Input Map**. Type a name in **Add New Action**, press **Add**, then click the **+** next to the action and press the key:

| Action | Key | Used for |
| --- | --- | --- |
| `cursor_up` | <kbd>↑</kbd> | Move the cursor |
| `cursor_down` | <kbd>↓</kbd> | |
| `cursor_left` | <kbd>←</kbd> | |
| `cursor_right` | <kbd>→</kbd> | |
| `reveal` | <kbd>Space</kbd> | Reveal (or chord) the cell under the cursor |
| `flag` | <kbd>F</kbd> | Flag the cell under the cursor |
| `restart` | <kbd>F2</kbd> | New game (F2 is the classic Minesweeper shortcut) |
| `pause` | <kbd>Esc</kbd> and <kbd>P</kbd> | The pause menu, in the menus chapter |

:::tip[Physical keys]
In the key dialog, choose **Physical Keycode**. Physical keys refer to a *position* on the keyboard rather than the letter printed on it, so the layout feels the same on QWERTY, AZERTY or Dvorak keyboards.
:::

## One cursor for mouse and keys

The keyboard needs a cursor: a highlighted cell that <kbd>Space</kbd> and <kbd>F</kbd> act on. Rather than tracking a separate keyboard cursor, we'll make the cell under the mouse *and* the keyboard cursor the same thing, `_hover`. Moving the mouse moves it; pressing arrows moves it; whichever you used last wins.

Add a colour and the variable to `board.gd`:

```gdscript title="board.gd"
const COLOR_CURSOR := Color("ffd166")

var _hover := NO_CELL
```

Draw it as an outline on top of everything else, at the end of `_draw`. It's hidden once the game is over:

```gdscript title="board.gd" ins={7-8}
func _draw() -> void:
	if model == null:
		return
	for y in model.height:
		for x in model.width:
			_draw_cell(Vector2i(x, y))
	if _hover != NO_CELL and not model.is_finished():
		draw_rect(_cell_rect(_hover).grow(1), COLOR_CURSOR, false, 2.0)
```

`draw_rect`'s third argument, `false`, means "outline, not filled", and `2.0` is the line width. `grow(1)` makes the outline sit on the gap between cells instead of covering the cell.

## Mouse hover

Mouse motion is another event `_gui_input` receives. Track the hovered cell, and clear it when the mouse leaves the board:

```gdscript title="board.gd" ins={2-4,15-17,20-23}
func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		_set_hover(_cell_at(event.position))
	elif event is InputEventMouseButton:
		var pos := _cell_at(event.position)
		if event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
			_reveal(pos)
		elif event.button_index == MOUSE_BUTTON_RIGHT and event.pressed:
			_toggle_flag(pos)
		elif event.button_index == MOUSE_BUTTON_MIDDLE and event.pressed:
			_reveal(pos)
		accept_event()


func _notification(what: int) -> void:
	if what == NOTIFICATION_MOUSE_EXIT:
		_set_hover(NO_CELL)


func _set_hover(pos: Vector2i) -> void:
	if pos != _hover:
		_hover = pos
		queue_redraw()
```

(The first line of `_gui_input` changes from `if` to `elif`.) Every node receives **notifications**, small engine messages like "you entered the tree" or "the mouse left you". `_notification` lets a script react to any of them.

`_set_hover` only redraws when the cell actually changes. The mouse sends many motion events while it moves within one cell, and none of them need a redraw.

## Keys

Keyboard actions aren't tied to a position on the board, so they belong in `_unhandled_input`, which receives everything that no UI control consumed:

```gdscript title="board.gd"
func _unhandled_input(event: InputEvent) -> void:
	var step := Vector2i.ZERO
	if event.is_action_pressed("cursor_left", true):
		step = Vector2i.LEFT
	elif event.is_action_pressed("cursor_right", true):
		step = Vector2i.RIGHT
	elif event.is_action_pressed("cursor_up", true):
		step = Vector2i.UP
	elif event.is_action_pressed("cursor_down", true):
		step = Vector2i.DOWN
	elif event.is_action_pressed("reveal"):
		_reveal(_hover)
	elif event.is_action_pressed("flag"):
		_toggle_flag(_hover)
	else:
		return
	if step != Vector2i.ZERO:
		_move_cursor(step)
	get_viewport().set_input_as_handled()


func _move_cursor(step: Vector2i) -> void:
	if _hover == NO_CELL:
		# The first key press puts the cursor in the middle of the board.
		@warning_ignore("integer_division")
		_set_hover(Vector2i(model.width / 2, model.height / 2))
		return
	var target := _hover + step
	_set_hover(target.clamp(Vector2i.ZERO, Vector2i(model.width - 1, model.height - 1)))
```

- **`is_action_pressed("cursor_left", true)`**: the second argument allows *echo* events, the repeats your operating system sends while a key is held down. Holding an arrow key glides the cursor across the board.
- **`Vector2i.LEFT`** and friends are `(-1, 0)`, `(1, 0)`, `(0, -1)` and `(0, 1)`. Remember that y points **down** in Godot, so `UP` is `(0, -1)`.
- **`clamp`** keeps the cursor on the board: at the left edge, moving left again does nothing.
- **`_reveal(_hover)` with no cursor** passes `NO_CELL`, which `_reveal` already ignores. No extra check needed.
- **`@warning_ignore("integer_division")`**: dividing two integers drops the remainder (9 / 2 is 4), and Godot warns about it because that's often a mistake. Here it's exactly what we want, so we silence the warning for that one line.

Update the doc comment at the top of `board.gd` too: it now handles key presses as well as clicks.

```gdscript title="board.gd" ins={2} del={1}
## Draws a BoardModel and turns clicks into moves.
## Draws a BoardModel and turns clicks and key presses into moves.
```

## Restart

Restarting is a whole-game action, not a board action, so it goes in `game.gd`. The simplest way to start over is to reload the scene: every node, the model, and all their variables are created fresh.

```gdscript title="game.gd"
func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("restart"):
		get_viewport().set_input_as_handled() # Before restarting: that frees this node.
		restart()


func restart() -> void:
	get_tree().reload_current_scene()
```

:::danger[Order matters]
`reload_current_scene()` removes the current scene from the tree immediately. After that line, `get_viewport()` returns `null` for this node, and calling `set_input_as_handled()` on it crashes with *"Cannot call method 'set_input_as_handled' on a null value"*. Handle the event first, then restart.
:::

Run it. Arrow keys move a yellow cursor, <kbd>Space</kbd> reveals or chords, <kbd>F</kbd> flags, and <kbd>F2</kbd> deals a new board. The mouse still works, and moves the same cursor.

```quiz
question: What does the `true` in `event.is_action_pressed("cursor_left", true)` do?
options:
  - Makes the action exact, ignoring modifier keys
  - Accepts echo events, so holding the key keeps moving the cursor
  - Marks the event as handled
answer: 1
explain: The second parameter is `allow_echo`. Without it, holding an arrow key would only move the cursor once.
```

```quiz
question: What is `Vector2i.UP`?
options:
  - (0, 1)
  - (0, -1)
  - (1, 0)
answer: 1
explain: In Godot 2D, y grows downwards, so up is negative y.
```

```quiz
question: Why does restart call `set_input_as_handled()` *before* `reload_current_scene()`?
options:
  - It doesn't matter; the order is just style
  - The reload removes this node from the tree, and get_viewport() returns null afterwards
  - reload_current_scene() ignores handled events
answer: 1
explain: Once the scene is removed, the node no longer has a viewport, so the call would fail on null.
```

```quiz
question: Which callback receives key presses that no UI control used?
type: text
answer: [_unhandled_input, "_unhandled_input()"]
explain: '`_unhandled_input` runs after the UI has had its chance, which is the right place for gameplay keys.'
```
