import * as THREE from 'three';
import { WeaponSystem } from './gun.js';

export class Player {
    constructor(camera, scene, controls, audioManager = null) {
        this.camera = camera;
        this.scene = scene;
        this.controls = controls;
        this.audioManager = audioManager;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.speed = 40.0;
        this.jumpForce = 15.0;
        this.health = 100;
        this.isAlive = true;

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;

        this.weaponSystem = new WeaponSystem(scene, camera, audioManager);

        // Character representation (visible to others, or when looking down)
        this.createCharacter();
        this.initInput();
    }

    createCharacter() {
        this.characterGroup = new THREE.Group();

        // Body (Shirt)
        const shirtGeom = new THREE.CylinderGeometry(0.3, 0.3, 1.0, 8);
        this.shirtMaterial = new THREE.MeshStandardMaterial({ color: 0x4444aa });
        this.shirt = new THREE.Mesh(shirtGeom, this.shirtMaterial);
        this.shirt.castShadow = true;
        this.shirt.receiveShadow = true;
        this.shirt.position.y = 0.5;
        this.characterGroup.add(this.shirt);

        // Head
        const headGeom = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
        this.head = new THREE.Mesh(headGeom, headMaterial);
        this.head.castShadow = true;
        this.head.receiveShadow = true;
        this.head.position.y = 1.2;
        this.characterGroup.add(this.head);

        // Hat
        const hatGeom = new THREE.BoxGeometry(0.45, 0.1, 0.45);
        this.hatMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
        this.hat = new THREE.Mesh(hatGeom, this.hatMaterial);
        this.hat.castShadow = true;
        this.hat.receiveShadow = true;
        this.hat.position.y = 1.45;
        this.characterGroup.add(this.hat);

        // Legs (Shorts)
        const shortsGeom = new THREE.BoxGeometry(0.5, 0.6, 0.3);
        this.shortsMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
        this.shorts = new THREE.Mesh(shortsGeom, this.shortsMaterial);
        this.shorts.castShadow = true;
        this.shorts.receiveShadow = true;
        this.shorts.position.y = -0.2;
        this.characterGroup.add(this.shorts);

        this.scene.add(this.characterGroup);
        // Position it at (0, 0, 0) relative to player position
    }

    updateColors(hat, shirt, shorts) {
        this.hatMaterial.color.set(hat);
        this.shirtMaterial.color.set(shirt);
        this.shortsMaterial.color.set(shorts);
    }

    initInput() {
        const onKeyDown = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW': this.moveForward = true; break;
                case 'ArrowLeft':
                case 'KeyA': this.moveLeft = true; break;
                case 'ArrowDown':
                case 'KeyS': this.moveBackward = true; break;
                case 'ArrowRight':
                case 'KeyD': this.moveRight = true; break;
                case 'Space': if (this.canJump === true) this.velocity.y += this.jumpForce; this.canJump = false; break;
                case 'Digit1': this.weaponSystem.switchWeapon(0); break;
                case 'Digit2': this.weaponSystem.switchWeapon(1); break;
                case 'Digit3': this.weaponSystem.switchWeapon(2); break;
                case 'KeyR': this.weaponSystem.reload(); break;
                case 'KeyZ': this.weaponSystem.toggleZoom(); break;
            }
        };

        const onKeyUp = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW': this.moveForward = false; break;
                case 'ArrowLeft':
                case 'KeyA': this.moveLeft = false; break;
                case 'ArrowDown':
                case 'KeyS': this.moveBackward = false; break;
                case 'ArrowRight':
                case 'KeyD': this.moveRight = false; break;
            }
        };

        const onMouseDown = (event) => {
            if (this.controls.isLocked && event.button === 0) {
                const raycaster = this.weaponSystem.fire();
                if (raycaster) {
                    // Signal shooting event (can be picked up by bot)
                    this.scene.dispatchEvent({ type: 'playerShot', raycaster: raycaster });
                }
            }
            // Right-click for sniper zoom
            if (this.controls.isLocked && event.button === 2) {
                event.preventDefault();
                this.weaponSystem.toggleZoom();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        document.addEventListener('mousedown', onMouseDown);
    }

    update(delta, mapData) {
        if (!this.isAlive) return;

        // Friction-like deceleration
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;
        this.velocity.y -= 9.8 * 4.0 * delta; // Gravity

        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * this.speed * 10.0 * delta;
        if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * this.speed * 10.0 * delta;

        // Collision detection (simplified)
        const oldPos = this.camera.position.clone();
        
        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);
        this.camera.position.y += (this.velocity.y * delta);

        if (this.camera.position.y < 1.6) {
            this.velocity.y = 0;
            this.camera.position.y = 1.6;
            this.canJump = true;
        }

        // Check horizontal collisions
        const playerBox = new THREE.Box3().setFromCenterAndSize(
            this.camera.position,
            new THREE.Vector3(1, 2, 1)
        );

        for (const obstacle of mapData.obstacles) {
            if (playerBox.intersectsBox(obstacle)) {
                // Restore horizontal position if collision detected
                this.camera.position.x = oldPos.x;
                this.camera.position.z = oldPos.z;
                break;
            }
        }

        // Update character model position
        this.characterGroup.position.copy(this.camera.position);
        this.characterGroup.position.y -= 1.6;
        this.characterGroup.rotation.y = this.camera.rotation.y;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (window.log) window.log(`Player took ${amount} damage. Current health: ${this.health}`);
        document.getElementById('health-info').textContent = 'Health: ' + Math.max(0, Math.floor(this.health));
        if (this.health <= 0 && this.isAlive) {
            this.isAlive = false;
            if (window.log) window.log("GAME OVER: Player died.");
            alert('Game Over! You were defeated.');
            window.location.reload();
        }
    }
}
