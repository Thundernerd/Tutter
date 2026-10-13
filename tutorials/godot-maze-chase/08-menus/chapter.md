---
title: Menus
summary: Main menu, pause menu, a saved high score, and the level clear and game over screens.
---

Godot's UI nodes all inherit from `Control`. Instead of positioning each button by hand, you nest them in **containers** that lay out their children automatically:

| Container | Does |
| --- | --- |
| `CenterContainer` | Centres its child |
| `VBoxContainer` / `HBoxContainer` | Stacks children vertically / horizontally |
| `GridContainer` | Arranges children in N columns |
