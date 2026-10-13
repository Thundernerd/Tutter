---
title: AI opponents
summary: CPU drivers that follow the road, brake for corners, get unstuck, wobble a little and steer around each other.
---

A CPU driver is a small object that sits in the car's seat. Every tick it looks at the track, decides on a `throttle` and a `steer`, and writes them into the car, exactly where player input would go. The car's handling, collisions and off-road slowdown all apply to CPU cars too, so they can't cheat: if they drift wide or clip a bowl, they lose time like you do.
