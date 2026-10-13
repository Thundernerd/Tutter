---
title: Menus
summary: A main menu, a pause menu, a game over screen, and a high score that survives restarts.
---

Godot's UI nodes all inherit from `Control`. You rarely position them by hand. Instead you put them in **containers**, which arrange their children automatically:

| Container | Arranges its children |
| --- | --- |
| `CenterContainer` | In the middle of the available space |
| `VBoxContainer` | In a vertical stack |
| `HBoxContainer` | In a horizontal row |
| `GridContainer` | In a table with a fixed number of columns |

Nest them and you can build almost any menu, and it stays tidy when the window changes size.
