---
title: Menus
summary: A main menu, a pause menu that hides the board, best times saved to disk, and a result screen.
---

Godot's UI nodes all inherit from `Control`. Instead of positioning each button by hand, you nest them in **containers** that lay out their children automatically. You've already used most of the ones you need:

| Container | Does | Used for |
| --- | --- | --- |
| `CenterContainer` | Centres its child | The board, every menu |
| `VBoxContainer` / `HBoxContainer` | Stacks children vertically / horizontally | Button lists, the HUD bar |
| `GridContainer` | Arranges children in N columns | The difficulty table, settings |
| `PanelContainer` | Draws a background behind its child | The HUD bar, the result panel |

This chapter wires up the screens around the game itself, and adds the first data that's saved to disk: best times.
