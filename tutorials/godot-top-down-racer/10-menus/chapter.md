---
title: Menus
summary: A main menu with a live race behind it, a screen to pick the mode, players and track, and a pause menu.
---

Godot's UI nodes all inherit from `Control`. Instead of positioning every button by hand, you nest them in **containers** that lay out their children automatically:

| Container | Does |
| --- | --- |
| `CenterContainer` | Centres its child |
| `VBoxContainer` / `HBoxContainer` | Stacks children vertically / horizontally |
| `GridContainer` | Arranges children in N columns, row by row |

Every screen in this chapter is a few of these nested inside each other.
