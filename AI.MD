# AI Documentation

## Overview
The bot is a simple autonomous AI agent designed to provide basic target practice for the player. It operates on a simple state machine and uses random target generation for movement.

## AI Logic
### Movement
- **Target Selection**: The bot picks a random coordinate within the map's boundaries.
- **Pathing**: The bot moves in a straight line towards its target.
- **Collision Avoidance**: If the bot's bounding box intersects with a map obstacle, it immediately picks a new random target to avoid getting stuck.
- **LookAt**: The bot always looks in the direction of its current movement or towards the player when in range.

### Combat
- **Detection Range**: The bot can detect the player if they are within 50 units.
- **Shooting Behavior**: When the player is in range, the bot faces the player and fires at a fixed interval (0.5 seconds).
- **Damage**: The bot's shots deal a fixed 10 damage to the player.
- **Health**: The bot has 100 HP. If its health drops to 0, it "falls down" (rotates 90 degrees) and respawns at its starting location after 3 seconds.

### Logic Updates
The bot's `update(delta, player, mapData)` method is called on every frame of the game loop, ensuring its behavior is smooth and reactive to the player's movements.

## Technical Implementation
- **Raycasting**: Used for line-of-sight checks (simplified in the current version).
- **Bounding Boxes**: Used for obstacle avoidance to prevent the bot from walking through walls.
- **Event Listeners**: The bot's `takeDamage` method can be triggered by events in the main game loop when the player's weapon raycast intersects with its mesh.
