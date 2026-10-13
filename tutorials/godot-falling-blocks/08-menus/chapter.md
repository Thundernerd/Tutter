---
title: Menus
summary: Main menu, pause menu, high scores saved to disk, and a game over screen.
---

Godot's UI nodes all inherit from `Control`. Instead of positioning each button by hand, you nest them in **containers** that lay out their children automatically. Three of them cover almost every menu in this chapter:

| Container | Does |
| --- | --- |
| `CenterContainer` | Centres its child |
| `VBoxContainer` / `HBoxContainer` | Stacks children vertically / horizontally |
| `GridContainer` | Arranges children in N columns, row by row |
