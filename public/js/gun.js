import * as THREE from 'three';

export function createWeapon(type, scene, camera) {
    const weaponGroup = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: 0x222222 });

    if (type === 'Glock') {
        // Glock style (handgun)
        const frameGeom = new THREE.BoxGeometry(0.1, 0.2, 0.4);
        const frame = new THREE.Mesh(frameGeom, material);
        weaponGroup.add(frame);

        const barrelGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8);
        const barrel = new THREE.Mesh(barrelGeom, material);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.05, 0.1);
        weaponGroup.add(barrel);

        const gripGeom = new THREE.BoxGeometry(0.1, 0.25, 0.15);
        const grip = new THREE.Mesh(gripGeom, material);
        grip.rotation.x = -Math.PI / 8;
        grip.position.set(0, -0.1, -0.15);
        weaponGroup.add(grip);

        weaponGroup.position.set(0.3, -0.3, -0.5);
    } else if (type === 'AK47') {
        // AK47 style (machine gun)
        const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });

        const bodyGeom = new THREE.BoxGeometry(0.12, 0.15, 0.8);
        const body = new THREE.Mesh(bodyGeom, material);
        weaponGroup.add(body);

        const barrelGeom = new THREE.CylinderGeometry(0.03, 0.03, 1.0, 8);
        const barrel = new THREE.Mesh(barrelGeom, material);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.04, 0.5);
        weaponGroup.add(barrel);

        const stockGeom = new THREE.BoxGeometry(0.1, 0.2, 0.4);
        const stock = new THREE.Mesh(stockGeom, woodMaterial);
        stock.position.set(0, -0.05, -0.5);
        weaponGroup.add(stock);

        const magGeom = new THREE.BoxGeometry(0.08, 0.4, 0.15);
        const mag = new THREE.Mesh(magGeom, material);
        mag.rotation.x = Math.PI / 6;
        mag.position.set(0, -0.25, 0.1);
        weaponGroup.add(mag);

        weaponGroup.position.set(0.3, -0.4, -0.6);
    } else if (type === 'Sniper') {
        // Sniper rifle (AWP style)
        const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x2d4a2d }); // Dark green

        // Main body
        const bodyGeom = new THREE.BoxGeometry(0.1, 0.12, 0.9);
        const body = new THREE.Mesh(bodyGeom, material);
        weaponGroup.add(body);

        // Long barrel
        const barrelGeom = new THREE.CylinderGeometry(0.035, 0.035, 1.4, 12);
        const barrel = new THREE.Mesh(barrelGeom, material);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.05, 0.8);
        weaponGroup.add(barrel);

        // Stock
        const stockGeom = new THREE.BoxGeometry(0.12, 0.18, 0.5);
        const stock = new THREE.Mesh(stockGeom, woodMaterial);
        stock.position.set(0, -0.05, -0.6);
        weaponGroup.add(stock);

        // Scope
        const scopeGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 12);
        const scope = new THREE.Mesh(scopeGeom, material);
        scope.rotation.z = Math.PI / 2;
        scope.position.set(0, 0.12, -0.1);
        weaponGroup.add(scope);

        // Scope mounts
        const mountGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8);
        const mount1 = new THREE.Mesh(mountGeom, material);
        mount1.position.set(0, 0.08, -0.25);
        weaponGroup.add(mount1);
        
        const mount2 = new THREE.Mesh(mountGeom, material);
        mount2.position.set(0, 0.08, 0.05);
        weaponGroup.add(mount2);

        // Bipod (front legs)
        const legGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.4, 8);
        const leg1 = new THREE.Mesh(legGeom, material);
        leg1.rotation.x = Math.PI / 6;
        leg1.position.set(0.08, -0.15, 1.0);
        weaponGroup.add(leg1);
        
        const leg2 = new THREE.Mesh(legGeom, material);
        leg2.rotation.x = -Math.PI / 6;
        leg2.position.set(-0.08, -0.15, 1.0);
        weaponGroup.add(leg2);

        weaponGroup.position.set(0.35, -0.35, -0.7);
    }

    camera.add(weaponGroup);
    return weaponGroup;
}

export class WeaponSystem {
    constructor(scene, camera, audioManager = null) {
        this.scene = scene;
        this.camera = camera;
        this.audioManager = audioManager;
        this.currentWeaponIndex = 0;
        this.weapons = [
            { name: 'Glock-18', ammo: 20, maxAmmo: 20, totalAmmo: 100, type: 'Glock', group: null, fireRate: 0.1, damage: 25, icon: '🔫', zoom: 1 },
            { name: 'AK-47', ammo: 30, maxAmmo: 30, totalAmmo: 90, type: 'AK47', group: null, fireRate: 0.08, damage: 18, icon: '🎯', zoom: 1 },
            { name: 'AWP Sniper', ammo: 5, maxAmmo: 5, totalAmmo: 30, type: 'Sniper', group: null, fireRate: 1.5, damage: 100, icon: '🎖️', zoom: 1 }
        ];
        this.lastFireTime = 0;
        this.raycaster = new THREE.Raycaster();
        this.isZoomed = false;
        this.defaultFOV = 75;
        this.zoomFOV = 25;

        this.init();
    }

    init() {
        this.weapons.forEach(w => {
            w.group = createWeapon(w.type, this.scene, this.camera);
            w.group.visible = false;
        });
        this.weapons[0].group.visible = true;
    }

    switchWeapon(index) {
        if (index < 0 || index >= this.weapons.length) return;
        this.weapons[this.currentWeaponIndex].group.visible = false;
        this.currentWeaponIndex = index;
        this.weapons[this.currentWeaponIndex].group.visible = true;
        
        // Reset zoom when switching away from sniper
        if (this.isZoomed && !this.weapons[index].name.includes('Sniper')) {
            this.toggleZoom(false);
        }
        
        this.updateUI();
    }

    toggleZoom(forceState = null) {
        const weapon = this.weapons[this.currentWeaponIndex];
        if (!weapon.name.includes('Sniper')) return; // Only sniper can zoom
        
        this.isZoomed = forceState !== null ? forceState : !this.isZoomed;
        
        // Update camera FOV
        this.camera.fov = this.isZoomed ? this.zoomFOV : this.defaultFOV;
        this.camera.updateProjectionMatrix();
        
        // Update crosshair
        const crosshair = document.getElementById('crosshair');
        if (this.isZoomed) {
            crosshair.classList.add('sniper');
            crosshair.style.opacity = '0.3';
        } else {
            crosshair.classList.remove('sniper');
            crosshair.style.opacity = '1';
        }
    }

    fire() {
        const weapon = this.weapons[this.currentWeaponIndex];
        const now = performance.now() / 1000;

        if (now - this.lastFireTime < weapon.fireRate) return null;
        if (weapon.ammo <= 0) {
            if (this.audioManager) this.audioManager.playEmpty();
            return null;
        }

        weapon.ammo--;
        this.lastFireTime = now;
        this.updateUI();

        // Visual muzzle flash (simple)
        const flash = new THREE.PointLight(0xffff00, 10, 5);
        flash.position.set(0.3, -0.3, -0.8);
        this.camera.add(flash);
        setTimeout(() => this.camera.remove(flash), 50);

        // Raycasting for hit detection
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        return this.raycaster;
    }

    reload() {
        const weapon = this.weapons[this.currentWeaponIndex];
        if (weapon.ammo === weapon.maxAmmo || weapon.totalAmmo <= 0) return;

        const needed = weapon.maxAmmo - weapon.ammo;
        const toReload = Math.min(needed, weapon.totalAmmo);
        weapon.ammo += toReload;
        weapon.totalAmmo -= toReload;
        this.updateUI();
        
        if (this.audioManager) this.audioManager.playReload();
    }

    updateUI() {
        const weapon = this.weapons[this.currentWeaponIndex];
        document.getElementById('weapon-info').textContent = 'Weapon: ' + weapon.name;
        document.getElementById('ammo-info').textContent = 'Ammo: ' + weapon.ammo + '/' + weapon.totalAmmo;
        
        // Update weapon icon display
        const iconDisplay = document.getElementById('gun-icon-display');
        const nameDisplay = document.getElementById('gun-name-display');
        if (iconDisplay && nameDisplay) {
            iconDisplay.textContent = weapon.icon;
            nameDisplay.textContent = weapon.name;
        }
    }
}
