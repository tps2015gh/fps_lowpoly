import * as THREE from 'three';

export function createMap(scene) {
    const mapData = {
        obstacles: [],
        meshes: [],
        ground: null,
        spawnPoints: {
            player: new THREE.Vector3(0, 1.6, 0),
            bot: new THREE.Vector3(30, 1.6, 30)
        }
    };

    // Patterned floor - checkerboard style with moss/green concrete
    const floorSize = 200;
    const tileSize = 10;
    const tiles = floorSize / tileSize;
    
    const mossColor1 = 0x3d5c3d; // Dark moss green
    const mossColor2 = 0x4a6b4a; // Light moss green
    const concreteColor = 0x555555;
    
    for (let x = 0; x < tiles; x++) {
        for (let z = 0; z < tiles; z++) {
            const isMoss = (x + z) % 3 === 0 || (x * z) % 7 === 0;
            const tileMaterial = new THREE.MeshStandardMaterial({ 
                color: isMoss ? (x % 2 === 0 ? mossColor1 : mossColor2) : concreteColor,
                roughness: 0.8
            });
            const tileGeom = new THREE.BoxGeometry(tileSize, 0.5, tileSize);
            const tile = new THREE.Mesh(tileGeom, tileMaterial);
            tile.position.set(
                (x - tiles/2) * tileSize + tileSize/2, 
                -0.25, 
                (z - tiles/2) * tileSize + tileSize/2
            );
            tile.receiveShadow = true;
            scene.add(tile);
            mapData.meshes.push(tile);
        }
    }

    // Outer walls with concrete texture
    const wallHeight = 10;
    const wallGeometryVertical = new THREE.BoxGeometry(2, wallHeight, 200);
    const wallGeometryHorizontal = new THREE.BoxGeometry(200, wallHeight, 2);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.9 });

    const wallN = new THREE.Mesh(wallGeometryHorizontal, wallMaterial);
    wallN.position.set(0, wallHeight/2, -100);
    wallN.castShadow = true;
    wallN.receiveShadow = true;
    scene.add(wallN);
    mapData.obstacles.push(new THREE.Box3().setFromObject(wallN));
    mapData.meshes.push(wallN);

    const wallS = new THREE.Mesh(wallGeometryHorizontal, wallMaterial);
    wallS.position.set(0, wallHeight/2, 100);
    wallS.castShadow = true;
    wallS.receiveShadow = true;
    scene.add(wallS);
    mapData.obstacles.push(new THREE.Box3().setFromObject(wallS));
    mapData.meshes.push(wallS);

    const wallE = new THREE.Mesh(wallGeometryVertical, wallMaterial);
    wallE.position.set(100, wallHeight/2, 0);
    wallE.castShadow = true;
    wallE.receiveShadow = true;
    scene.add(wallE);
    mapData.obstacles.push(new THREE.Box3().setFromObject(wallE));
    mapData.meshes.push(wallE);

    const wallW = new THREE.Mesh(wallGeometryVertical, wallMaterial);
    wallW.position.set(-100, wallHeight/2, 0);
    wallW.castShadow = true;
    wallW.receiveShadow = true;
    scene.add(wallW);
    mapData.obstacles.push(new THREE.Box3().setFromObject(wallW));
    mapData.meshes.push(wallW);

    // Terrain - Hills and elevated areas
    const hillMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5d3a, roughness: 0.9 });
    const createHill = (radius, height, x, z) => {
        const segments = 16;
        const hillGeom = new THREE.CylinderGeometry(radius, radius * 0.7, height, segments);
        const hill = new THREE.Mesh(hillGeom, hillMaterial);
        hill.position.set(x, height/2 - 0.5, z);
        hill.castShadow = true;
        hill.receiveShadow = true;
        scene.add(hill);
        mapData.obstacles.push(new THREE.Box3().setFromObject(hill));
        mapData.meshes.push(hill);
    };

    createHill(15, 4, -50, -50);
    createHill(12, 3, 50, -40);
    createHill(18, 5, -40, 50);
    createHill(10, 2, 60, 60);

    // Bunkers - Military-style concrete structures
    const bunkerMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.95 });
    const createBunker = (x, z, rotation) => {
        const bunkerGroup = new THREE.Group();
        
        // Main bunker body
        const bodyGeom = new THREE.BoxGeometry(12, 5, 10);
        const body = new THREE.Mesh(bodyGeom, bunkerMaterial);
        body.position.y = 2.5;
        body.castShadow = true;
        body.receiveShadow = true;
        bunkerGroup.add(body);
        
        // Roof overhang
        const roofGeom = new THREE.BoxGeometry(14, 1, 12);
        const roof = new THREE.Mesh(roofGeom, bunkerMaterial);
        roof.position.y = 5.5;
        roof.castShadow = true;
        roof.receiveShadow = true;
        bunkerGroup.add(roof);
        
        // Entrance
        const entranceGeom = new THREE.BoxGeometry(4, 4, 3);
        const entrance = new THREE.Mesh(entranceGeom, bunkerMaterial);
        entrance.position.set(0, 2, 5);
        entrance.castShadow = true;
        bunkerGroup.add(entrance);
        
        // Gun slit (decorative)
        const slitGeom = new THREE.BoxGeometry(3, 1, 1);
        const slit = new THREE.Mesh(slitGeom, new THREE.MeshStandardMaterial({ color: 0x222222 }));
        slit.position.set(0, 3.5, -4.9);
        bunkerGroup.add(slit);
        
        bunkerGroup.position.set(x, 0, z);
        bunkerGroup.rotation.y = rotation;
        scene.add(bunkerGroup);
        
        // Add collision box
        const bunkerBox = new THREE.Box3().setFromObject(bunkerGroup);
        mapData.obstacles.push(bunkerBox);
        mapData.meshes.push(bunkerGroup);
    };

    createBunker(-30, -30, Math.PI / 4);
    createBunker(40, -50, -Math.PI / 6);
    createBunker(-60, 40, Math.PI / 3);
    createBunker(50, 50, -Math.PI / 4);

    // Sandbag barriers
    const sandbagMaterial = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 1.0 });
    const createSandbag = (x, z) => {
        const sandbagGeom = new THREE.CylinderGeometry(0.8, 0.8, 0.6, 8);
        const sandbag = new THREE.Mesh(sandbagGeom, sandbagMaterial);
        sandbag.position.set(x, 0.3, z);
        sandbag.castShadow = true;
        sandbag.receiveShadow = true;
        scene.add(sandbag);
        mapData.obstacles.push(new THREE.Box3().setFromObject(sandbag));
        mapData.meshes.push(sandbag);
    };

    // Sandbag walls near bunkers
    for (let i = 0; i < 5; i++) {
        createSandbag(-20 + i * 2, -20);
        createSandbag(30, 40 + i * 2);
        createSandbag(-50 + i * 2, 30);
    }

    // Crates and barrels
    const crateMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 });
    const barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x2f4f4f, roughness: 0.7 });
    
    const createCrate = (w, h, d, x, y, z) => {
        const geom = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geom, crateMaterial);
        mesh.position.set(x, y + h/2, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        mapData.obstacles.push(new THREE.Box3().setFromObject(mesh));
        mapData.meshes.push(mesh);
    };

    const createBarrel = (x, y, z) => {
        const geom = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 12);
        const mesh = new THREE.Mesh(geom, barrelMaterial);
        mesh.position.set(x, y + 0.75, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        mapData.obstacles.push(new THREE.Box3().setFromObject(mesh));
        mapData.meshes.push(mesh);
    };

    // Scattered crates and barrels
    createCrate(3, 3, 3, 10, 0, 10);
    createCrate(4, 5, 4, -15, 0, 15);
    createCrate(5, 3, 5, 20, 0, -10);
    createCrate(3, 4, 3, -25, 0, -25);
    createCrate(6, 4, 6, 0, 0, 30);
    createCrate(4, 6, 4, 40, 0, 0);
    createCrate(3, 3, 3, -40, 0, -40);
    
    // Barrel clusters
    createBarrel(15, 0, 15);
    createBarrel(16, 0, 15);
    createBarrel(15, 0, 16);
    createBarrel(-35, 0, 25);
    createBarrel(-36, 0, 25);
    createBarrel(25, 0, -35);
    createBarrel(26, 0, -35);

    // Ramps (sloped terrain)
    const rampMaterial = new THREE.MeshStandardMaterial({ color: 0x6b6b4b, roughness: 0.9 });
    const createRamp = (x, z, rotation) => {
        const rampGeom = new THREE.BoxGeometry(15, 1, 8);
        const ramp = new THREE.Mesh(rampGeom, rampMaterial);
        ramp.position.set(x, 1, z);
        ramp.rotation.x = Math.PI / 12;
        ramp.rotation.y = rotation;
        ramp.castShadow = true;
        ramp.receiveShadow = true;
        scene.add(ramp);
        mapData.obstacles.push(new THREE.Box3().setFromObject(ramp));
        mapData.meshes.push(ramp);
    };

    createRamp(-10, -60, 0);
    createRamp(60, -10, Math.PI / 2);
    createRamp(-70, -20, Math.PI / 4);

    return mapData;
}
