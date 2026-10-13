---
title: Installing Godot
description: Download Godot and get to know the project manager.
estimatedMinutes: 5
---

This tutorial builds a complete Pong: two paddles, a ball that speeds up, scoring, a CPU opponent, a main menu, a pause menu, an options screen with saved settings and key rebinding, sound effects, and finally an exported game you can share.

![Two CPU paddles rallying in the finished game](./images/pong-preview.gif)

Every chapter ends in a working game, so you can stop at any point and still have something that runs.

## Download

Grab the **standard** (non-.NET) build of Godot 4 from the official site. It is a single executable with no installer. This tutorial was written against Godot 4.7, but anything from 4.3 up works.

:::tip
On macOS, drag Godot into `/Applications` so Spotlight can find it.
:::

## The project manager

When you start Godot you land in the *project manager*. This is where you create, import and open projects. Everything else (scenes, scripts, settings) happens in the *editor* that opens once you pick a project.

```quiz
question: Which Godot build do you need for GDScript-only projects?
options:
  - The .NET build
  - The standard build
  - Either; they are identical
answer: 1
explain: The .NET build adds C# support. For GDScript the **standard** build is smaller and simpler.
```
