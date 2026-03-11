# Weapons

## Overview
This game features two basic weapon types, both implemented using low-poly primitives (boxes, cylinders) to minimize memory usage and rendering overhead.

## Weapon Types

### 1. Glock-18 (Handgun)
- **Model**: Constructed from a rectangular frame, a cylindrical barrel, and a slightly angled grip.
- **Stats**: 
  - **Magazine Capacity**: 20 rounds.
  - **Total Ammo**: 100 rounds.
  - **Fire Rate**: 0.1 seconds between shots.
- **Behavior**: Standard semi-automatic fire.

### 2. AK-47 (Machine Gun)
- **Model**: Constructed from a main rectangular body, a long cylindrical barrel, a wooden stock, and a curved magazine.
- **Stats**:
  - **Magazine Capacity**: 30 rounds.
  - **Total Ammo**: 90 rounds.
  - **Fire Rate**: 0.08 seconds (slightly faster than Glock).
- **Behavior**: Higher fire rate, intended for fully automatic fire simulation.

## Weapon Mechanics
- **Switching**: Press `1` or `2` to swap between weapons. Only the active weapon's model is rendered.
- **Reloading**: Press `R` to reload. If you have reserve ammo, it fills the current magazine up to its maximum capacity.
- **Muzzle Flash**: Each shot generates a brief yellow light near the gun's barrel for visual feedback.
- **UI Feedback**: Current weapon name, ammo count, and total ammo are displayed in the bottom-right corner of the HUD.
