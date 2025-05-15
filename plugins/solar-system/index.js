// index.js - Solar System Visualization Plugin

import { Plugin3D } from '../../src/core/Plugin3D.js';

export default class SolarSystemPlugin extends Plugin3D {
    // Required static properties
    static id = 'solar-system';
    static name = 'Solar System';
    static description = 'Visualization of planets orbiting the sun';
    static renderingType = '3d';
    
    constructor(core) {
        super(core);
        
        // Store planets data and animation state
        this.planets = [];
        this.orbitalSpeeds = {};
        this.lastTime = 0;
    }
    
    async start() {
        // Set up camera
        this.setCameraPosition(0, 30, 100);
        this.lookAt(0, 0, 0);
        
        // Add parameters
        this.addSlider('orbitSpeed', 'Orbit Speed', 1, { min: 0.1, max: 5, step: 0.1 });
        this.addCheckbox('showOrbits', 'Show Orbit Paths', true);
        this.addColorPalette();
        
        // Create planets and orbit paths
        this.createSolarSystem();
        
        // Start animation
        this.requestAnimation(this.animate.bind(this));
    }
    
    createSolarSystem() {
        const THREE = this.renderEnv.THREE;
        if (!THREE) return;
        
        // Create main group for all planets
        this.mainMeshGroup = this.createGroup();
        this.setMainMesh(this.mainMeshGroup);
        
        // Create the sun
        const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 1
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.addMesh(sun);
        this.mainMeshGroup.add(sun);
        
        // Create ambient light
        this.createAmbientLight({ intensity: 0.3 });
        
        // Create point light at sun's position
        this.createPointLight({
            color: 0xffffff,
            intensity: 1.5,
            distance: 0,
            position: [0, 0, 0]
        });
        
        // Planet data: [distance, size, color, orbital period in days]
        const planetData = [
            ['Mercury', 10, 0.8, 0xaaaaaa, 88],
            ['Venus', 15, 1.5, 0xf5deb3, 225],
            ['Earth', 20, 1.6, 0x6b93d6, 365],
            ['Mars', 25, 1.2, 0xc1440e, 687],
            ['Jupiter', 40, 4, 0xd8ca9d, 4333],
            ['Saturn', 55, 3.5, 0xead6aa, 10759],
            ['Uranus', 70, 2.5, 0x73cbf0, 30687],
            ['Neptune', 85, 2.4, 0x3341ff, 60190]
        ];
        
        // Create the planets
        planetData.forEach(([name, distance, size, color, period]) => {
            // Create planet
            const planetGeometry = new THREE.SphereGeometry(size, 24, 24);
            const planetMaterial = new THREE.MeshStandardMaterial({ 
                color: color,
                roughness: 0.7,
                metalness: 0.1
            });
            const planet = new THREE.Mesh(planetGeometry, planetMaterial);
            
            // Calculate initial position
            const angle = Math.random() * Math.PI * 2;
            planet.position.x = Math.cos(angle) * distance;
            planet.position.z = Math.sin(angle) * distance;
            
            // Add to scene
            this.addMesh(planet);
            this.mainMeshGroup.add(planet);
            
            // Store planet info for animation
            this.planets.push({
                mesh: planet,
                distance: distance,
                angle: angle,
                name: name
            });
            
            // Calculate orbital speed (in radians per second)
            this.orbitalSpeeds[name] = (2 * Math.PI) / period;
            
            // Create orbit path
            if (this.getParameter('showOrbits')) {
                this.createOrbitPath(distance);
            }
        });
        
        // Apply render mode
        this.applyRenderMode('standard', {
            opacity: 1.0,
            colorPalette: this.getParameter('colorPalette') || 'default'
        });
    }
    
    createOrbitPath(distance) {
        const THREE = this.renderEnv.THREE;
        if (!THREE) return;
        
        // Create orbit path as a wireframe ring
        const orbitGeometry = new THREE.RingGeometry(distance - 0.1, distance + 0.1, 64);
        const orbitMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x444444, 
            wireframe: true,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbit.rotation.x = Math.PI / 2; // Align with XZ plane
        
        // Add to scene
        this.addMesh(orbit);
        this.mainMeshGroup.add(orbit);
    }
    
    animate(deltaTime) {
        // Skip if no planets
        if (!this.planets.length) return true;
        
        // Get current orbit speed modifier
        const speedModifier = this.getParameter('orbitSpeed');
        
        // Update each planet's position
        this.planets.forEach(planet => {
            // Calculate angular velocity based on orbital period
            const angularSpeed = this.orbitalSpeeds[planet.name] * speedModifier;
            
            // Update angle
            planet.angle += angularSpeed * deltaTime;
            
            // Update position
            planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
            planet.mesh.position.z = Math.sin(planet.angle) * planet.distance;
        });
        
        // Render the scene
        this.render();
        
        return true; // Continue animation
    }
    
    onParameterChanged(parameterId, value) {
        if (parameterId === 'showOrbits') {
            // Re-create the scene with or without orbit paths
            this.mainMeshGroup.clear();
            this.createSolarSystem();
        } else if (parameterId === 'colorPalette') {
            // Update render mode with new palette
            this.updateRenderProperties({
                colorPalette: value
            });
        }
    }
}
