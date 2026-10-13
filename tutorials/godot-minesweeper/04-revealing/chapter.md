---
title: Revealing
summary: Flood fill, the algorithm that opens empty regions, written two ways.
---

Clicking a `0` should open every connected empty cell at once, plus the numbers around them. Doing that by hand would mean dozens of clicks for information the game already knows is safe. The algorithm that does it is called **flood fill**, the same one behind the paint bucket in image editors.

This chapter writes it twice: first the short recursive version (and why it can crash), then the version we'll keep, with an explicit queue.
