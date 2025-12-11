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
    backgroundColor: null, // null = transparent
    enableShadows: true,
    antialias: true,
};

/**
 * Convert millimeters to screen units (1/10 scale)
 * @param {number} value_mm - Value in millimeters
 * @param {boolean} is120 - Whether this is a 120 format canister
 * @returns {number} Scaled value for screen rendering
 */
function mm2screen(value_mm, is120 = false) {
    // Scale differently based on canister size
    // 35: / 10
    // 120: / 13.5
    return is120 ? value_mm / 13.5 : value_mm / 10;
}

/**
 * Create a film canister mesh with texture
 * @param {string} textureUrl - URL or data URL of the label texture
 * @param {Object} options - Canister options
 * @param {number} options.textureRotation - Rotation angle in radians (0, Math.PI/2, Math.PI, etc.)
 * @param {boolean} options.autoRotateTexture - Auto-rotate vertical images to horizontal (default: true)
 * @param {boolean} options.is120 - Whether to render 120 format canister (default: false for 35mm)
 * @returns {THREE.Group} Canister group with mesh
 */
export function createCanister(textureUrl, options = {}) {
    const is120 = options.is120 ?? false;
    const group = new THREE.Group();

    // Canister dimensions in mm converted to screen units
    let radius, height, capHeight, topCapRadius;
    if (is120) {
        topCapRadius = mm2screen(25.1 / 2, true);
        radius = topCapRadius * 0.8;
        height = mm2screen(62.7, true);
        capHeight = mm2screen(1.25, true);
    } else {
        radius = mm2screen(12.13, false);
        capHeight = mm2screen(2.5, false);
        height = mm2screen(47.09 - 5.72, false) - capHeight * 2;
        topCapRadius = radius * 1.035;
    }

    // Load texture
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(textureUrl, (loadedTexture) => {
        // Auto-rotate vertical images to horizontal if enabled
        const autoRotate = true;
        let finalRotation = 0;
        
        if (autoRotate && loadedTexture.image) {
            const img = loadedTexture.image;
            const isVertical = img.height > img.width;
            
            if (isVertical) {
                // Start with 90 degrees for vertical images
                finalRotation = Math.PI / 2;
            }
        }
        
        // Add manual rotation on top of auto-rotation
        if (options.textureRotation !== undefined && options.textureRotation !== 0) {
            finalRotation += options.textureRotation;
        }
        
        // Apply final rotation
        if (finalRotation !== 0) {
            loadedTexture.rotation = finalRotation;
            loadedTexture.center.set(0.5, 0.5);
            loadedTexture.needsUpdate = true;
        }
    });
    
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    
    // Improve texture quality
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16; // Maximum anisotropic filtering

    // Canister body (cylinder) with custom shader for saturation boost
    const bodyGeometry = new THREE.CylinderGeometry(radius, radius, height, 32);

    // Material is different between 120 and 35mm canisters
    // 120 uses a more matte finish
    const bodyMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        metalness: 0.1,
        roughness: is120 ? 0.6 : 0.15,
    });
    
    // Custom shader to boost saturation and crush colors
    bodyMaterial.onBeforeCompile = (shader) => {
        // Add uniforms
        shader.uniforms.saturationBoost = { value: 1.12 };
        shader.uniforms.colorDepth = { value: 32.0 };
        
        // Inject saturation adjustment and color crushing into fragment shader
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <map_fragment>',
            `
            #include <map_fragment>
            
            // Apply effects to textured areas
            if (vMapUv.x >= 0.0) {
                vec3 color = diffuseColor.rgb;
                
                // Saturation boost
                float gray = dot(color, vec3(0.299, 0.587, 0.114));
                vec3 grayVec = vec3(gray);
                color = mix(grayVec, color, saturationBoost);
                
                // Color depth reduction (posterization)
                color = floor(color * colorDepth) / colorDepth;
                
                diffuseColor.rgb = color;
            }
            `
        );
        
        // Add uniform declarations
        shader.fragmentShader = 'uniform float saturationBoost;\nuniform float colorDepth;\n' + shader.fragmentShader;
    };
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Top and bottom caps
    const capGeometry = new THREE.CylinderGeometry(topCapRadius, topCapRadius, capHeight, 32);
    const capMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: is120 ? 0.1 : 0.5,
        roughness: is120 ? 0.3 : 0.1,
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
    if (!is120) {
        const spoolCapRadiusOuter = mm2screen(11.21 / 2, false);
        const spoolCapHeight = mm2screen(5.72, false);
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
    }

    // Rotate to show the label front (opposite side from seam)
    group.rotation.y = -Math.PI;

    return group;
}

/**
 * Set up scene with lighting
 * @param {Object} config - Scene configuration
 * @param {boolean} config.is120 - Whether rendering 120 format canister
 * @returns {Object} Scene, camera, and renderer
 */
export function setupScene(config = {}) {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const is120 = cfg.is120 ?? false;

    // Scene
    const scene = new THREE.Scene();
    scene.background = cfg.backgroundColor ? new THREE.Color(cfg.backgroundColor) : null;

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
    renderer.toneMappingExposure = 1.8;
    
    // Boost color output for more vibrant rendering
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Lighting

    // Ambient light for general illumination (reduced since we have hemisphere)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Main directional lights (key lights)
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(15, 2, 8);
    scene.add(mainLight);

    const mainLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    mainLight2.position.set(-15, 1.2, -8);
    scene.add(mainLight2);

    // Fill light from the top with shadows enabled
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.2);
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
    const pointLight = new THREE.DirectionalLight(0xffffff, 0.3);
    pointLight.position.set(15, -2, 8);
    scene.add(pointLight);

    // Add a box light to the left side for better illumination
    const rectLight = new THREE.RectAreaLight(0xffffff, 1.0, 2, 10);
        rectLight.position.set(-1, 0, 2);
        rectLight.lookAt(0, 0, 0);
        scene.add(rectLight);
    

    // Ground plane for shadows
    if (cfg.enableShadows) {
        const groundSize = 1000;
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
        const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.45 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;

        // Position based on canister size
        if (is120) {
            ground.position.y = -mm2screen(62.7, true) / 2 - mm2screen(2.5, true);
        } else {
            ground.position.y = -mm2screen(47.09 - 6.72, false) / 2;
        }

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
    
    // Disable orbit controls if specified
    if (cfg.enableOrbit === false) {
        controls.enabled = false;
    }

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
