/**
 * Three.js Film Canister Thumbnail Generator
 * 
 * Renders a 3D film canister with custom texture wrapping
 * Can be used in-browser or headless for server-side generation
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Default renderer configuration
 */
const DEFAULT_CONFIG = {
    width: 400,
    height: 400,
    canisterRadius: 0.5,
    canisterHeight: 0.5,
    cameraDistance: 1000,
    backgroundColor: '#ffffff',
    enableShadows: true,
    antialias: true,
};

/**
 * Convert millimeters to screen units (1/10 scale)
 * @param {number} value_mm - Value in millimeters
 * @returns {number} Scaled value for screen rendering
 */
function mm2screen(value_mm) {
    return value_mm / 10;
}

/**
 * Create a film canister mesh with texture
 * @param {string} textureUrl - URL or data URL of the label texture
 * @param {Object} options - Canister options
 * @returns {THREE.Group} Canister group with mesh
 */
export function createCanister(textureUrl, options = {}) {
    const group = new THREE.Group();

    // Canister dimensions in mm converted to screen units
    const radius = mm2screen(12.13);
    const bodyHeight = mm2screen(47.09 - 5.72);
    const capHeight = mm2screen(2.5);
    const height = bodyHeight - capHeight * 2;

    // Load texture
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(textureUrl);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    // Canister body (cylinder) with custom shader for saturation boost
    const bodyGeometry = new THREE.CylinderGeometry(radius, radius, height, 32);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        metalness: 0.15,
        roughness: 0.25,
    });
    
    // Custom shader to boost saturation
    bodyMaterial.onBeforeCompile = (shader) => {
        // Add saturation uniform
        shader.uniforms.saturationBoost = { value: 1.0 };
        
        // Inject saturation adjustment into fragment shader
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <map_fragment>',
            `
            #include <map_fragment>
            
            // Apply saturation boost
            if (vMapUv.x >= 0.0) {
                vec3 color = diffuseColor.rgb;
                float gray = dot(color, vec3(0.299, 0.587, 0.114));
                vec3 grayVec = vec3(gray);
                diffuseColor.rgb = mix(grayVec, color, saturationBoost);
            }
            `
        );
        
        // Add uniform declaration
        shader.fragmentShader = 'uniform float saturationBoost;\n' + shader.fragmentShader;
    };
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Top and bottom caps
    const topCapRadius = radius * 1.035;
    const capGeometry = new THREE.CylinderGeometry(topCapRadius, topCapRadius, capHeight, 32);
    const capMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.5,
        roughness: 0.1,
    });
    
    const topCap = new THREE.Mesh(capGeometry, capMaterial);
    topCap.position.y = height / 2 + 0.05;
    topCap.castShadow = true;
    group.add(topCap);

    const bottomCap = new THREE.Mesh(capGeometry, capMaterial);
    bottomCap.position.y = -height / 2 - 0.05;
    bottomCap.castShadow = true;
    group.add(bottomCap);

    // Spool ring (hollow cylinder on top)
    const spoolCapRadiusOuter = mm2screen(11.21 / 2);
    const spoolCapRadiusInner = mm2screen(9.47 / 2);
    const spoolCapHeight = mm2screen(5.72);
    const spoolMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.1,
        roughness: 0.3,
    });

    // Outer cylinder wall
    const spoolRingGeometry = new THREE.CylinderGeometry(
        spoolCapRadiusOuter, 
        spoolCapRadiusOuter, 
        spoolCapHeight, 
        32,
        1,
        true // Open ended
    );
    const spoolRing = new THREE.Mesh(spoolRingGeometry, spoolMaterial);
    spoolRing.position.y = height / 2 + capHeight / 2 + spoolCapHeight / 2;
    spoolRing.castShadow = true;
    group.add(spoolRing);

    // Inner cylinder wall
    const spoolInnerWallGeometry = new THREE.CylinderGeometry(
        spoolCapRadiusInner,
        spoolCapRadiusInner,
        spoolCapHeight,
        32,
        1,
        false // Closed ends
    );
    const spoolInnerWall = new THREE.Mesh(spoolInnerWallGeometry, spoolMaterial);
    spoolInnerWall.position.y = height / 2 + capHeight / 2 + spoolCapHeight / 2;
    spoolInnerWall.castShadow = true;
    group.add(spoolInnerWall);

    // Top ring cap
    const topRingGeometry = new THREE.RingGeometry(spoolCapRadiusInner, spoolCapRadiusOuter, 32);
    const topRing = new THREE.Mesh(topRingGeometry, spoolMaterial);
    topRing.rotation.x = -Math.PI / 2;
    topRing.position.y = height / 2 + capHeight / 2 + spoolCapHeight;
    topRing.castShadow = true;
    group.add(topRing);

    // Bottom ring cap (inside surface)
    const bottomRing = new THREE.Mesh(topRingGeometry, spoolMaterial);
    bottomRing.rotation.x = Math.PI / 2;
    bottomRing.position.y = height / 2 + capHeight / 2;
    group.add(bottomRing);

    // Rotate to show the label front (opposite side from seam)
    group.rotation.y = -Math.PI;

    return group;
}

/**
 * Set up scene with lighting
 * @param {Object} config - Scene configuration
 * @returns {Object} Scene, camera, and renderer
 */
export function setupScene(config = {}) {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(cfg.backgroundColor);

    // Camera
    const camera = new THREE.PerspectiveCamera(
        25,
        cfg.width / cfg.height,
        1,
        10000
    );

    // Set camera to be front with a slight elevation (pulled back for FOV 25)
    camera.position.set(0, 100, cfg.cameraDistance);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
        antialias: cfg.antialias,
        alpha: true,
        preserveDrawingBuffer: true, // Needed for toDataURL
    });
    renderer.setSize(cfg.width, cfg.height);
    renderer.shadowMap.enabled = cfg.enableShadows;
    renderer.shadowMap.type = THREE.VSMShadowMap; // Softer shadows than PCF
    
    // Use Linear tone mapping for more vibrant colors
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 2.1;
    
    // Boost color output for more vibrant rendering
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Lighting

    // Ambient light for general illumination (reduced since we have hemisphere)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Main directional lights (key lights)
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(12, 2, 10);
    scene.add(mainLight);

    const mainLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight2.position.set(-8, 3, 6);
    scene.add(mainLight2);

    // Fill light from the top with shadows enabled
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-0.5, 10, 1.5);
    fillLight.castShadow = true;
    fillLight.shadow.mapSize.width = 2048;
    fillLight.shadow.mapSize.height = 2048;
    fillLight.shadow.camera.near = 1;
    fillLight.shadow.camera.far = 50;
    fillLight.shadow.camera.left = -30;
    fillLight.shadow.camera.right = 30;
    fillLight.shadow.camera.top = 30;
    fillLight.shadow.camera.bottom = -30;
    fillLight.shadow.radius = 12;
    fillLight.shadow.bias = -0.0005;
    scene.add(fillLight);

    // Add another point light from the front-bottom
    const pointLight = new THREE.DirectionalLight(0xffffff, 0.2);
    pointLight.position.set(0, -1, 10);
    scene.add(pointLight);
    

    // Ground plane for shadows
    if (cfg.enableShadows) {
        const groundSize = 1000;
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
        const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.45 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -mm2screen(47.09 - 6.72) / 2;
        ground.receiveShadow = true;
        scene.add(ground);
    }

    return { scene, camera, renderer };
}

/**
 * Render canister to data URL
 * @param {string} textureUrl - Texture image URL
 * @param {Object} config - Render configuration
 * @returns {Promise<string>} Data URL of rendered image
 */
export async function renderCanisterToDataURL(textureUrl, config = {}) {
    return new Promise((resolve, reject) => {
        try {
            const { scene, camera, renderer } = setupScene(config);

            // Create canister
            const canister = createCanister(textureUrl, config);
            scene.add(canister);

            // Wait for texture to load, then render
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(
                textureUrl,
                () => {
                    // Texture loaded, render the scene
                    renderer.render(scene, camera);

                    // Convert to data URL
                    const dataURL = renderer.domElement.toDataURL('image/png');

                    // Cleanup
                    renderer.dispose();
                    scene.clear();

                    resolve(dataURL);
                },
                undefined,
                (error) => {
                    reject(new Error(`Failed to load texture: ${error}`));
                }
            );
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Render canister to canvas element (for live preview)
 * @param {HTMLElement} container - Target container element
 * @param {string} textureUrl - Texture image URL
 * @param {Object} config - Render configuration
 * @returns {Object} Scene controls for interaction
 */
export function renderCanisterToCanvas(container, textureUrl, config = {}) {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    const { scene, camera, renderer } = setupScene(cfg);

    // Mount renderer to provided container
    container.appendChild(renderer.domElement);

    // Add OrbitControls for interactive camera control
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 13;
    controls.autoRotate = cfg.autoRotate ?? false;
    controls.autoRotateSpeed = 1.0;

    // Create canister
    const canister = createCanister(textureUrl, cfg);
    scene.add(canister);

    // Animation loop for smooth rendering
    let animationId;
    function animate() {
        animationId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Return control interface
    return {
        dispose: () => {
            cancelAnimationFrame(animationId);
            controls.dispose();
            renderer.dispose();
            scene.clear();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        },
        setRotation: (x, y, z) => {
            canister.rotation.set(x, y, z);
        },
        setAutoRotate: (enabled) => {
            controls.autoRotate = enabled;
        },
        screenshot: () => {
            renderer.render(scene, camera);
            return renderer.domElement.toDataURL('image/png');
        },
        controls,
    };
}

/**
 * Generate thumbnail blob for upload
 * @param {string} textureUrl - Texture image URL
 * @param {Object} config - Render configuration
 * @returns {Promise<Blob>} PNG blob
 */
export async function generateThumbnailBlob(textureUrl, config = {}) {
    const dataURL = await renderCanisterToDataURL(textureUrl, config);

    // Convert data URL to blob
    const response = await fetch(dataURL);
    const blob = await response.blob();

    return blob;
}

export default {
    createCanister,
    setupScene,
    renderCanisterToDataURL,
    renderCanisterToCanvas,
    generateThumbnailBlob,
    DEFAULT_CONFIG,
};
