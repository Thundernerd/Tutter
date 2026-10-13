---
title: The track
summary: A track drawn from one curve, with a tabletop, kerbs, off-road slowdown and solid obstacles.
---

Micro Machines tracks are ordinary household surfaces: tables, desks, gardens. We build ours from a single idea: **the track is a curve**. One closed `Curve2D` runs along the middle of the road, and everything else follows from it. The road is drawn along the curve, "off-road" means "too far from the curve", and later the laps, the CPU drivers and the race positions all measure distances along it.

No art files needed: the tabletop, road, kerbs and props are all drawn from code.
