import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { createMap } from './map.js';
import { Player } from './player.js';
import { Bot } from './bot.js';
import { createWeapon } from './gun.js';
import { AudioManager } from './audio.js';

// Game variables
let scene, camera, renderer, controls;
let clock = new THREE.Clock();
let player, bot;
let mapData;
let audioManager;

// Expose audioManager globally for bot access
window.audioManager = null;

function createTracer(from, to, color = 0xffff00) {
    const points = [from, to];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ 
        color: color, 
        transparent: true, 
        opacity: 1.0,
        linewidth: 2
    });
    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false; // Ensure line is always rendered
    scene.add(line);

    // Fade out and remove
    let opacity = 1.0;
    const fade = setInterval(() => {
        opacity -= 0.15;
        material.opacity = opacity;
        if (opacity <= 0) {
            clearInterval(fade);
            scene.remove(line);
            geometry.dispose();
            material.dispose();
        }
    }, 30);
}

// DOM Elements
const btnStart = document.getElementById('btn-start');
const customizationPanel = document.getElementById('customization-panel');
const logContainer = document.getElementById('log-container');

function log(msg) {
    console.log(msg);
    if (logContainer) {
        const entry = document.createElement('div');
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;
        // Keep only last 15 entries
        while (logContainer.children.length > 15) {
            logContainer.removeChild(logContainer.firstChild);
        }
    }
    // Send to server
    fetch('/log', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: msg
    }).catch(err => console.error("Failed to send log to server", err));
}
window.log = log;

// Global error handler
window.onerror = function(message, source, lineno, colno, error) {
    log(`ERROR: ${message} at ${source}:${lineno}:${colno}`);
    return false;
};

function init() {
    log("Initializing game...");
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    scene.fog = new THREE.Fog(0x87ceeb, 0, 500);

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    // Controls
    controls = new PointerLockControls(camera, document.body);

    audioManager = new AudioManager();
    window.audioManager = audioManager;

    // Map creation
    mapData = createMap(scene);

    // Player initialization
    player = new Player(camera, scene, controls, audioManager);
    
    // Bot initialization
    bot = new Bot(scene, mapData);

    // Event listeners
    btnStart.addEventListener('click', () => {
        log("Start button clicked, attempting to lock...");
        controls.lock();
    });

    controls.addEventListener('lock', () => {
        log("Mouse locked. Game running.");
        customizationPanel.style.display = 'none';
    });

    controls.addEventListener('unlock', () => {
        log("Mouse unlocked. Game paused.");
        customizationPanel.style.display = 'block';
    });

    window.addEventListener('resize', onWindowResize);

    // Shooting event listener
    scene.addEventListener('playerShot', (event) => {
        const weapon = player.weaponSystem.weapons[player.weaponSystem.currentWeaponIndex];
        
        // Play appropriate sound
        if (weapon.name.includes('Sniper')) {
            audioManager.playSniperShot();
            log("Player fired sniper rifle!");
        } else {
            audioManager.playShot();
            log("Player fired weapon.");
        }

        const raycaster = event.raycaster;
        const damage = weapon.damage || 25;

        // Find hit point for tracer
        const allIntersects = raycaster.intersectObjects([...mapData.meshes, bot.characterGroup], true);
        let targetPoint = raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(100));

        if (allIntersects.length > 0) {
            targetPoint = allIntersects[0].point;
        }

        // Create tracer from weapon muzzle (approximate)
        createTracer(player.camera.position.clone().add(new THREE.Vector3(0.3, -0.3, -0.5).applyQuaternion(player.camera.quaternion)), targetPoint);

        const intersects = raycaster.intersectObjects([bot.characterGroup], true);
        if (intersects.length > 0) {
            log(`Bot HIT! Applying ${damage} damage (${weapon.name}).`);
            bot.takeDamage(damage);
            bot.lastDamageTime = performance.now(); // Trigger bot reaction delay
            audioManager.playHit(); // Play hit sound
            // Visual feedback (blood splash placeholder)
            const splash = new THREE.PointLight(0xff0000, 5, 2);
            splash.position.copy(intersects[0].point);
            scene.add(splash);
            setTimeout(() => scene.remove(splash), 50);
        }
    });

    scene.addEventListener('botShot', (event) => {
        audioManager.playBotShot();
        const from = event.from;
        const to = event.to;
        createTracer(from, to, 0xff0000); // Red tracer for bot
    });

    // Input for customization
    document.getElementById('btn-save-colors').addEventListener('click', () => {
        const hatColor = document.getElementById('color-hat').value;
        const shirtColor = document.getElementById('color-shirt').value;
        const shortsColor = document.getElementById('color-shorts').value;
        player.updateColors(hatColor, shirtColor, shortsColor);
    });

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

let lastHeartbeat = 0;
let lastDifficultyUpdate = 0;

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const now = performance.now();
    if (now - lastHeartbeat > 5000) {
        log(`Heartbeat: Loop alive. Controls Locked: ${controls.isLocked}`);
        lastHeartbeat = now;
    }
    
    // Update difficulty display every second
    if (now - lastDifficultyUpdate > 1000) {
        document.getElementById('difficulty-info').textContent = 
            `Bot Difficulty: Level ${bot.difficultyLevel} | DMG: ${bot.damageDealt} | ACC: ${Math.round(bot.accuracy * 100)}%`;
        lastDifficultyUpdate = now;
    }

    if (controls.isLocked) {
        player.update(delta, mapData);
        bot.update(delta, player, mapData);
    }

    renderer.render(scene, camera);
}

// Start the game
init();
