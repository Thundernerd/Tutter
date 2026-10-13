---
title: Sound effects
description: AudioStreamPlayers on the SFX bus, triggered by the board's signals.
estimatedMinutes: 15
---

## Get some sounds

Download the five sounds used in this tutorial: [minesweeper-sounds.zip](./files/minesweeper-sounds.zip). Unzip it into a `sounds/` folder in your project. Godot imports `.wav` files automatically.

| File | Plays when |
| --- | --- |
| `reveal.wav` | A single cell is revealed: a short soft tick |
| `cascade.wav` | A flood fill opens several cells: a quick upward sweep |
| `flag.wav` | A flag is placed or removed: a low thunk |
| `boom.wav` | You hit a mine: a noisy rumble |
| `win.wav` | You clear the board: a rising arpeggio |

Want your own? [jsfxr](https://sfxr.me) generates retro sound effects in the browser: try the *Blip/Select*, *Explosion* and *Powerup* presets.

## Players

Add a plain `Node` named `Sounds` to `game.tscn` (just a folder for tidiness) with five `AudioStreamPlayer` children:

| Node | Stream | Bus |
| --- | --- | --- |
| `Reveal` | `reveal.wav` | `SFX` |
| `Cascade` | `cascade.wav` | `SFX` |
| `Flag` | `flag.wav` | `SFX` |
| `Boom` | `boom.wav` | `SFX` |
| `Win` | `win.wav` | `SFX` |

Setting **Bus** to `SFX` is what makes the effects slider work. Also give the options screen's `TestSound` the `reveal.wav` stream.

:::note
`AudioStreamPlayer` plays at the same volume everywhere. `AudioStreamPlayer2D` gets quieter and pans with distance from the camera, which is great for big levels but pointless for a board that fits on one screen.
:::

## One more signal

The game hears about flags, wins and losses, but not about ordinary reveals. Add a signal to `board.gd` that reports how many cells a move opened:

```gdscript title="board.gd" ins={1}
signal cells_revealed(count: int)
signal flags_changed(flags_left: int)
```

Emit it in `_reveal` when the game goes on (wins and losses have their own sounds):

```gdscript title="board.gd" ins={7-8}
	match model.state:
		BoardModel.GameState.LOST:
			game_lost.emit(model.exploded)
		BoardModel.GameState.WON:
			flags_changed.emit(model.flags_left())
			game_won.emit()
		_:
			cells_revealed.emit(revealed.size())
	queue_redraw()
```

`_` is `match`'s catch-all: any state that isn't `LOST` or `WON`.

## Play them

Connect `cells_revealed` to `Game` in the Node dock, then add the sounds to `game.gd`:

```gdscript title="game.gd" ins={1-5,10-11,16,22}
func _on_board_cells_revealed(count: int) -> void:
	if count > 1:
		$Sounds/Cascade.play()
	else:
		$Sounds/Reveal.play()


func _on_board_flags_changed(flags_left: int) -> void:
	hud.set_mines_left(flags_left)
	if not model.is_finished():
		$Sounds/Flag.play()


func _on_board_game_lost(_cell: Vector2i) -> void:
	hud.set_face(SmileyButton.Face.DEAD)
	$Sounds/Boom.play()
	_end_game(false)


func _on_board_game_won() -> void:
	hud.set_face(SmileyButton.Face.COOL)
	$Sounds/Win.play()
	_new_record = Records.submit(Settings.difficulty, elapsed)
	_end_game(true)
```

The `is_finished()` check matters: winning auto-flags the remaining mines and emits `flags_changed`, and the flag thunk on top of the victory jingle sounds like a mistake.

This is the payoff of signals: the board has no idea sounds exist. Delete the `Sounds` node and the lines in `game.gd` that play it, and the game plays exactly the same, silently.

```quiz
question: Why does the flag sound check `model.is_finished()`?
options:
  - Flags can't be placed after the game
  - Winning emits flags_changed too (for the auto-flagged mines), and the flag sound shouldn't play over the win sound
  - To save CPU
answer: 1
explain: The counter must update on a win, but the sound is only for the player's own right-clicks.
```

```quiz
question: Which bus should game sound players use so the effects slider controls them?
type: text
answer: [SFX, "&\"SFX\""]
explain: The effects slider sets the SFX bus volume. SFX feeds into Master, so the master slider affects it too.
```
