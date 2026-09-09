# Liquid Glass Chat Bubble

A standalone liquid-glass chat bubble skeleton. It contains only:

- one shared bubble material for both chat roles
- Hyalite SVG backdrop refraction for Chromium
- a Safari wallpaper-lens fallback
- timestamps
- viewport-bounded filters that prevent long chat histories from exhausting mobile GPU memory

## Agent integration prompt

> Integrate only the liquid-glass chat bubble from this repository into my existing chat frontend. Preserve all existing data, APIs, message content, and page layout. Map my existing message DOM to the `.message-row > .bubble` structure, then include `glass-bubbles.css`, `vendor/hyalite.js`, and `glass-bubbles.js`. Do not copy the demo background. Do not remove the viewport-bounded resource-release logic. Both chat roles must use the same glass material.

## Parameters

- Opacity: `--bubble-opacity` in CSS
- Refraction strength: `thickness` in JavaScript
- Refracted edge width: `bevel`
- Center frost: `blur`

Hyalite is from [VII-Cae/hyalite--liquid-glass](https://github.com/VII-Cae/hyalite--liquid-glass) and is MIT licensed.
