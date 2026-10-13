---
title: Menus
summary: Main menu, pause menu and game over screen, built with Godot's UI containers.
---

Godot's UI nodes all inherit from `Control`. Instead of positioning each button by hand, you nest them in **containers** that lay out their children automatically. Get comfortable with three of them and you can build most menus:

| Container | Does |
| --- | --- |
| `CenterContainer` | Centres its child |
| `VBoxContainer` / `HBoxContainer` | Stacks children vertically / horizontally |
| `GridContainer` | Arranges children in N columns |
