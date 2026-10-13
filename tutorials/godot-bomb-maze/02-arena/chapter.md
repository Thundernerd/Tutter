---
title: The arena
summary: A TileSet with collision, three TileMapLayers, and a script that reads and writes cells.
---

The arena is a grid of 17×13 cells, 24 pixels each. Most of the game's logic is about cells: which ones are walls, which hold blocks, where a blast reaches. Godot's tile system gives us both the drawing and that grid for free:

| Piece | What it is |
| --- | --- |
| **Atlas texture** | A PNG with several tiles side by side |
| **TileSet** | A resource describing the tiles in that texture: size, collision, extra data |
| **TileMapLayer** | A node that draws tiles from a TileSet into grid cells |
