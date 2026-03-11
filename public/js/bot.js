import * as THREE from 'three';

export class Bot {
    constructor(scene, mapData) {
        this.scene = scene;
        this.mapData = mapData;
        this.health = 100;
        this.maxHealth = 100;
        this.isAlive = true;
        
        // Difficulty settings - starts easy, gets harder
        this.difficultyLevel = 1;
        this.maxDifficulty = 5;
        this.damageDealt = 5; // Start with low damage (easy)
        this.speed = 1.5; // Slower movement
        this.shootRange = 30; // Shorter range
        this.shootRate = 1.2; // Slower fire rate
        this.accuracy = 0.3; // 30% accuracy (low)
        this.reactionDelay = 800; // ms delay before shooting
        
        this.lastShootTime = 0;
        this.lastDamageTime = 0;
        this.shotsFired = 0;
        this.shotsHit = 0;

        this.createCharacter();
        this.position = mapData.spawnPoints.bot.clone();
        this.characterGroup.position.copy(this.position);

        this.targetPos = this.getRandomTarget();
        this.raycaster = new THREE.Raycaster();
    }

    createCharacter() {
        this.characterGroup = new THREE.Group();

        // Body (Shirt)
        const shirtGeom = new THREE.CylinderGeometry(0.3, 0.3, 1.0, 8);
        this.shirtMaterial = new THREE.MeshStandardMaterial({ color: 0xaa4444 });
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

        // Gun (simple cylinder)
        const gunGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8);
        const gunMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
        this.gun = new THREE.Mesh(gunGeom, gunMaterial);
        this.gun.castShadow = true;
        this.gun.receiveShadow = true;
        this.gun.rotation.x = Math.PI / 2;
        this.gun.position.set(0.3, 0.6, 0.4);
        this.characterGroup.add(this.gun);

        this.scene.add(this.characterGroup);
    }

    getRandomTarget() {
        return new THREE.Vector3(
            (Math.random() - 0.5) * 150,
            0,
            (Math.random() - 0.5) * 150
        );
    }

    update(delta, player, mapData) {
        if (!this.isAlive) return;

        // Check if player shot the bot
        this.checkIfShotByPlayer(player);

        // Basic AI movement
        const distToTarget = this.position.distanceTo(this.targetPos);
        if (distToTarget < 1) {
            this.targetPos = this.getRandomTarget();
        }

        const dir = new THREE.Vector3().subVectors(this.targetPos, this.position).normalize();
        const moveVec = dir.clone().multiplyScalar(this.speed * delta);
        
        // Simple obstacle avoidance (if bot hits obstacle, pick new target)
        const nextPos = this.position.clone().add(moveVec);
        const botBox = new THREE.Box3().setFromCenterAndSize(nextPos, new THREE.Vector3(1, 2, 1));
        
        let collision = false;
        for (const obstacle of mapData.obstacles) {
            if (botBox.intersectsBox(obstacle)) {
                collision = true;
                break;
            }
        }

        if (collision) {
            this.targetPos = this.getRandomTarget();
        } else {
            this.position.copy(nextPos);
            this.characterGroup.position.copy(this.position);
            this.characterGroup.lookAt(this.targetPos.x, this.position.y, this.targetPos.z);
        }

        // Shooting at player
        const distToPlayer = this.position.distanceTo(player.camera.position);
        if (distToPlayer < this.shootRange) {
            this.characterGroup.lookAt(player.camera.position.x, this.position.y, player.camera.position.z);
            this.shootAtPlayer(player);
        }
    }

    shootAtPlayer(player) {
        const now = performance.now() / 1000;
        const nowMs = performance.now();
        
        // Check reaction delay
        if (nowMs - this.lastDamageTime < this.reactionDelay) return;
        if (now - this.lastShootTime < this.shootRate) return;

        // Line of sight check
        const dirToPlayer = new THREE.Vector3().subVectors(player.camera.position, this.position).normalize();
        this.raycaster.set(this.position, dirToPlayer);

        // Use actual meshes for collision check
        const intersects = this.raycaster.intersectObjects(this.mapData.meshes, true);

        // If something is hit and it's closer than the player, block shot
        const distToPlayer = this.position.distanceTo(player.camera.position);
        if (intersects.length > 0 && intersects[0].distance < distToPlayer) {
            // Hit a wall/obstacle instead - still show tracer to obstacle
            const hitPoint = this.position.clone().add(dirToPlayer.clone().multiplyScalar(intersects[0].distance));
            this.scene.dispatchEvent({ type: 'botShot', from: this.position.clone().add(new THREE.Vector3(0, 1, 0)), to: hitPoint });
            return;
        }

        // Check accuracy - bot might miss!
        this.shotsFired++;
        if (Math.random() > this.accuracy) {
            // Bot misses - shoot slightly off target
            const missOffset = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );
            const missPos = player.camera.position.clone().add(missOffset);
            this.scene.dispatchEvent({ type: 'botShot', from: this.position.clone().add(new THREE.Vector3(0, 1, 0)), to: missPos });
            this.lastShootTime = now;
            return;
        }

        // Bot hits!
        this.shotsHit++;
        this.lastShootTime = now;
        if (window.log) window.log(`Bot shooting at player! Damage: ${this.damageDealt}`);
        player.takeDamage(this.damageDealt);

        // Dispatch event for tracer visualization
        const muzzlePos = this.position.clone().add(new THREE.Vector3(0, 1, 0));
        const playerPos = player.camera.position.clone();
        this.scene.dispatchEvent({ type: 'botShot', from: muzzlePos, to: playerPos });

        // Visual effect
        const flash = new THREE.PointLight(0xff0000, 5, 2);
        flash.position.copy(this.position).add(new THREE.Vector3(0, 1, 0));
        this.scene.add(flash);
        setTimeout(() => this.scene.remove(flash), 50);
    }

    increaseDifficulty() {
        // Increase difficulty based on bot deaths
        if (this.difficultyLevel < this.maxDifficulty) {
            this.difficultyLevel++;
            
            // Scale stats with difficulty
            const scale = this.difficultyLevel / 5;
            this.damageDealt = 5 + Math.floor(scale * 10); // 5 -> 15
            this.speed = 1.5 + scale * 1.5; // 1.5 -> 3.0
            this.shootRange = 30 + scale * 30; // 30 -> 60
            this.shootRate = 1.2 - scale * 0.7; // 1.2 -> 0.5
            this.accuracy = 0.3 + scale * 0.5; // 0.3 -> 0.8
            this.reactionDelay = 800 - scale * 600; // 800ms -> 200ms
            
            if (window.log) window.log(`Bot difficulty increased to level ${this.difficultyLevel}!`);
        }
    }

    checkIfShotByPlayer(player) {
        // This is a bit tricky with current setup. 
        // I'll add an event listener in the game.js for playerShot.
    }

    takeDamage(amount) {
        this.health -= amount;
        if (window.log) window.log(`Bot took ${amount} damage. Current health: ${this.health}`);
        if (this.health <= 0 && this.isAlive) {
            this.isAlive = false;
            this.characterGroup.rotation.x = Math.PI / 2; // "Fall down"
            this.characterGroup.position.y = 0.2;

            // Play bot death sound
            if (window.audioManager) window.audioManager.playBotDeath();

            if (window.log) window.log("Bot killed!");
            
            // Track kill for difficulty
            this.botDeaths = (this.botDeaths || 0) + 1;

            setTimeout(() => {
                this.respawn();
            }, 3000);
        }
    }

    respawn() {
        if (window.log) window.log("Bot respawning...");
        this.isAlive = true;
        this.health = this.maxHealth;
        this.position.copy(this.mapData.spawnPoints.bot);
        this.characterGroup.position.copy(this.position);
        this.characterGroup.rotation.x = 0;
        this.characterGroup.position.y = 0;
        
        // Increase difficulty after respawn
        this.increaseDifficulty();
    }
}
