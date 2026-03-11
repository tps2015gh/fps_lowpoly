# Game Physics

## Overview
This game uses a simplified custom physics engine based on Three.js primitives and raycasting. It is designed to be lightweight and performant on systems with limited resources (8GB RAM).

## Key Components
### Collision Detection
- **Player-Obstacle**: The player is represented by a 1x2x1 bounding box (`Box3`). On each frame, the horizontal movement is calculated and checked for intersection with the map's obstacles. If a collision is detected, the horizontal movement is reverted.
- **Gravity**: A constant downward force is applied to the player's vertical velocity. If the player's height drops below the ground level (1.6 units for eye-level), gravity is zeroed out and jumping is re-enabled.

### Hit Detection (Weapon Physics)
- **Raycasting**: When a shot is fired, a `THREE.Raycaster` projects a line from the camera's center forward into the scene.
- **Bot Collision**: The raycaster checks for intersections with the bot's character group (multiple meshes including head, body, and limbs).
- **Muzzle Flash**: A `PointLight` is briefly added to the camera to simulate the flash of a gun firing.

## Limitations
- **No Rigid Body Dynamics**: There is no momentum transfer between objects.
- **Simplified Bounding Boxes**: Obstacles are static and their bounding boxes are pre-calculated for efficiency.
- **Single Level**: All physics calculations happen on a single flat ground plane with vertical obstacles.
