# AI Maintenance Guide

## Overview
This file serves as a guide for Qwen Code, Gemini CLI, or other AI agents to maintain and extend this codebase.

## AI Models
- **Qwen Code**: Primary development assistant for code implementation, refactoring, and documentation
- **Gemini-1.5-Pro**: Initial project conceptualization and documentation

## Project Structure
- `public/`: All static files (HTML, CSS, JS).
- `server/`: Go-based static file server.
- `doc/`: Detailed markdown documentation.

## Coding Standards
- **ES Modules**: Use modern ES6 modules for all JavaScript. Use `import` and `export` to keep code modular.
- **Three.js**: Follow Three.js 0.160.0 standards. Use CDN for easy maintenance without `npm`.
- **Low-Poly Assets**: Only use primitive geometries (`BoxGeometry`, `CylinderGeometry`, `SphereGeometry`) to keep memory usage below 8GB. Avoid high-resolution textures or complex model files (GLTF/OBJ) unless explicitly requested.

## Common Maintenance Tasks
- **Adding New Weapons**: Use `createWeapon(type, scene, camera)` in `gun.js` and add a new entry to the `weapons` array in the `WeaponSystem` class.
- **Adding Map Obstacles**: Use `createBox(w, h, d, x, y, z)` in `map.js` to add more crates or walls to the map.
- **Improving AI**: Enhance `bot.js` by adding more states (e.g., "patrol," "chase," "flee") or implementing a simple pathfinding algorithm (e.g., A*).
- **Extending Customization**: Add new color inputs to `index.html` and update the `updateColors` method in `player.js` to apply them to more character parts.

## Troubleshooting
- **Mouse Lock Issues**: Ensure the user has clicked the "Start Game" button, as the Pointer Lock API requires a user gesture.
- **Dependency Issues**: If Three.js fails to load, check the `importmap` in `index.html` and ensure the unpkg CDN is accessible.
- **Server Errors**: Run `go run server/main.go` from the root and check if port 8080 is available.
