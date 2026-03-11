# Program Documentation

## Overview
This is a lightweight, interactive web-based first-person shooter (FPS) game built using Three.js and Go. It is designed to run efficiently on low-memory systems (8GB RAM) by minimizing the number of dependencies and assets.

## Architecture
### Frontend (Browser)
- **Three.js**: Used for all 3D rendering and basic physics (raycasting).
- **ES Modules**: Utilizes modern JavaScript features with CDN-served libraries to avoid `npm` build overhead.
- **HUD (HTML/CSS)**: The user interface is implemented using standard HTML and CSS elements overlaid on the WebGL canvas.
- **Customization Panel**: A side panel allows the player to change the colors of their character (hat, shirt, and shorts) before or during the game.

### Backend (Server)
- **Go**: A simple Go server serves the static files from the `public` directory.
- **Standard Library**: Only Go's `net/http` and `path/filepath` are used to minimize the final executable size.

## File Structure
- `public/`: Contains all client-side assets (HTML, CSS, JS).
  - `index.html`: Main entry point.
  - `js/game.js`: Core game loop and initialization.
  - `js/map.js`: Map generation.
  - `js/player.js`: Player movement and input handling.
  - `js/bot.js`: Simple AI logic.
  - `js/gun.js`: Weapon models and shooting system.
- `server/main.go`: Simple Go static file server.
- `doc/`: Detailed documentation for physics, weapons, and program logic.
- `README.MD`: General project overview.

## Getting Started
1. Install Go on your Windows 11 system.
2. Open a terminal in the root directory.
3. Run the server using: `go run server/main.go`.
4. Open your browser and navigate to `http://localhost:8080`.
5. Customize your character's colors and click "Start Game" to lock the mouse and begin playing.
