---
title: A fair randomizer
description: Why pure randomness feels unfair, and the 7-bag that fixes it.
estimatedMinutes: 15
---

`pick_random()` is truly random, and that's the problem. With seven equally likely pieces, you'll regularly see the same piece three times in a row, and every so often you'll wait 20 or 30 pieces for an `I` that never comes. Players experience that as the game cheating.

## The 7-bag

Modern falling blocks games deal pieces like cards: put one of each of the seven pieces in a bag, shuffle it, and hand them out in order. When the bag is empty, shuffle a fresh one. Every seven pieces you get every piece exactly once, so:

- there are never more than 12 other pieces between two of the same kind (first in one bag, last in the next: 6 + 6 in between),
- you never get more than two of the same piece in a row (last of one bag, first of the next),
- it still feels random from one bag to the next.

The game also needs to *look ahead* for the next-piece preview, so the bag keeps a queue of upcoming pieces and refills it whenever it runs low. Create `piece_bag.gd`:

```gdscript title="piece_bag.gd"
class_name PieceBag
extends RefCounted
## The "7-bag" randomizer: deals all seven pieces in a random order,
## then shuffles a fresh bag. Never more than 12 pieces between two of a kind.

var _queue: Array[int] = []


## Take the next piece type out of the bag.
func next() -> int:
	_fill(1)
	return _queue.pop_front()


## The next `count` piece types, without taking them out.
func peek(count: int) -> Array[int]:
	_fill(count)
	return _queue.slice(0, count)


func _fill(count: int) -> void:
	while _queue.size() < count:
		var bag: Array[int] = []
		bag.assign(Tetromino.Type.values())
		bag.shuffle()
		_queue.append_array(bag)
```

- `_fill(count)` makes sure the queue holds at least `count` pieces, adding whole shuffled bags at the end. Because it only ever appends complete bags, the "each piece once per seven" guarantee holds no matter how far ahead we peek.
- `Tetromino.Type.values()` returns a plain `Array`; `assign` copies it into our typed `Array[int]`.
- `shuffle()` uses Godot's global random number generator, which is seeded randomly at startup.
- The leading underscore on `_queue` and `_fill` marks them as private: nothing outside this script should touch them. GDScript doesn't enforce that, but it's a convention every Godot developer reads.

## Use it

In `game.gd`, deal from a bag. To watch the bag at work, let <kbd>Space</kbd> (our `hard_drop` action) swap in the next piece for now, and print each piece's name:

```gdscript title="game.gd" ins={5,12-18,24} del={11}
extends Node2D

## The falling piece.
var piece: Tetromino
var bag := PieceBag.new()

@onready var board: Board = $Board


func _ready() -> void:
	_spawn(Tetromino.Type.values().pick_random())
	_spawn(bag.next())


func _unhandled_input(event: InputEvent) -> void:
	# Temporary: Space swaps in the next piece, so we can watch the bag at work.
	if event.is_action_pressed(&"hard_drop"):
		_spawn(bag.next())


func _spawn(piece_type: int) -> void:
	piece = Tetromino.spawn(piece_type, Board.COLUMNS)
	board.piece = piece
	print(Tetromino.Type.keys()[piece_type])
```

`&"hard_drop"` is a **StringName**, a string Godot interns for fast comparisons. Input actions are StringNames internally, so we use them for action names throughout. `Tetromino.Type.keys()` is `["I", "O", "T", ...]`, which turns a type number back into its letter.

Run the game, press <kbd>Space</kbd> repeatedly and watch the Output panel. Split the letters into groups of seven from the start: each group contains all seven letters.

```text
T Z O L J S I | S I O L T J Z | O Z J T I S L | ...
```

That's the end of the chapter: pieces exist, appear in the right place and arrive in a fair order. Next, they learn to move.

```quiz
question: With a 7-bag, what's the longest possible run of the same piece in a row?
options:
  - "1"
  - "2"
  - "7"
  - There's no limit
answer: 1
explain: A piece appears once per bag. The most you can get is the last piece of one bag followed by the same piece first in the next bag.
```

```quiz
question: What does `bag.peek(3)` do to the queue?
options:
  - Removes the first three pieces
  - Nothing visible; it may append a new shuffled bag, but doesn't remove anything
  - Shuffles the queue
answer: 1
explain: '`peek` only reads. It calls `_fill` so there are enough pieces to look at, which can add a fresh bag at the end.'
```
