---
title: The playfield
summary: A 10×20 grid stored as plain data, and drawing it with _draw().
---

If you've made a physics game in Godot, you might expect blocks to be bodies with collision shapes that stack on top of each other. They aren't. A falling blocks puzzle lives on a grid: a block is either in a cell or it isn't, pieces move one whole cell at a time, and "collision" means "is that cell taken?". So the playfield is an array of numbers, and Godot's job is only to draw it.
