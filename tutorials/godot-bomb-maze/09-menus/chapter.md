---
title: Menus
summary: Main menu, mode select, pause menu, and round and match results.
---

Godot's UI nodes all inherit from `Control`, and you rarely position them by hand. Instead you nest them in **containers** that lay out their children:

| Container | Does |
| --- | --- |
| `CenterContainer` | Centres its child |
| `VBoxContainer` / `HBoxContainer` | Stacks children vertically / horizontally |
| `GridContainer` | Arranges children in N columns |

Every screen in this chapter is a `CenterContainer` holding a `VBoxContainer`.
