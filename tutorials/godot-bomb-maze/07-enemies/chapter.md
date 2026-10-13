---
title: Enemies
summary: Wandering monsters, a danger map that predicts fire, and a CPU bomber that plans with it.
---

Two kinds of opponent, one simple and one clever:

| | Monster | CPU bomber |
| --- | --- | --- |
| Moves | cell to cell, turning at random | along planned paths |
| Kills by | touching a bomber | bombs |
| Avoids danger | no | yes, using a danger map |
| Node | `Area2D` | the same `Bomber` scene a player uses, plus a `CpuBrain` child |
