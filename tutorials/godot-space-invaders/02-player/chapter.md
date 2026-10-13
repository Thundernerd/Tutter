---
title: The player
summary: A laser cannon that slides along the bottom and fires one shot at a time.
---

Space Invaders has nothing solid in it: shots fly *into* things and destroy them, nothing ever bounces or blocks. So instead of the physics bodies you may know from Pong, every moving object in this game is an `Area2D`: a node that detects overlaps and nothing else.
