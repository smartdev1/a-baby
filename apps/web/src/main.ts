import * as BABYLON from "babylonjs";
import { Client } from "colyseus.js";
import { WorldGenerator } from "world-generator";

// Initialize Babylon.js engine
const initializeEngine = (): BABYLON.Engine => {
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
  return new BABYLON.Engine(canvas, true);
};

// Create basic scene with lighting
const createScene = (engine: BABYLON.Engine): { scene: BABYLON.Scene; canvas: HTMLCanvasElement; hudElement: HTMLDivElement } => {
  const scene = new BABYLON.Scene(engine);
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

  // Third-person camera with WASD movement
  const camera = new BABYLON.FreeCamera(
    "camera",
    new BABYLON.Vector3(0, 5, -10),
    scene
  );
  camera.minZ = 0.1;
  camera.maxZ = 1000;
  camera.attachControl(canvas, true);

  // Input controls for camera movement
  const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false
  };

  window.addEventListener("keydown", (e) => {
    switch (e.code) {
      case "KeyW": keys.forward = true; break;
      case "KeyS": keys.backward = true; break;
      case "KeyA": keys.left = true; break;
      case "KeyD": keys.right = true; break;
    }
  });

  window.addEventListener("keyup", (e) => {
    switch (e.code) {
      case "KeyW": keys.forward = false; break;
      case "KeyS": keys.backward = false; break;
      case "KeyA": keys.left = false; break;
      case "KeyD": keys.right = false; break;
    }
  });

  let moveSpeed = 5; // meters per second
  let lastTime = performance.now();

  scene.registerAfterRender(() => {
    const now = performance.now();
    const delta = (now - lastTime) / 1000; // seconds
    lastTime = now;

    // Calculate movement direction based on camera yaw
    const horizontalAngle = camera.rotation.y;
    const dx = Math.sin(horizontalAngle) * moveSpeed * delta;
    const dz = Math.cos(horizontalAngle) * moveSpeed * delta;

    if (keys.forward) {
      camera.position.x += dx;
      camera.position.z += dz;
    }
    if (keys.backward) {
      camera.position.x -= dx;
      camera.position.z -= dz;
    }
    if (keys.left) {
      // Strafe left (-90 degrees from forward)
      const strafeAngle = horizontalAngle - Math.PI / 2;
      camera.position.x += Math.sin(strafeAngle) * moveSpeed * delta;
      camera.position.z += Math.cos(strafeAngle) * moveSpeed * delta;
    }
    if (keys.right) {
      // Strafe right (+90 degrees from forward)
      const strafeAngle = horizontalAngle + Math.PI / 2;
      camera.position.x += Math.sin(strafeAngle) * moveSpeed * delta;
      camera.position.z += Math.cos(strafeAngle) * moveSpeed * delta;
    }

    // Keep camera at reasonable height
    if (camera.position.y < 1) camera.position.y = 1;
  });

  // Background color
  scene.clearColor = new BABYLON.Color4(0.53, 0.81, 0.98, 1.0); // Light blue sky

  // Lighting - hemispheric light for outdoor environment
  const light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0), // Direction (upwards)
    scene
  );
  light.intensity = 1.5;

  // Ground plane matching world bounds (300x300m)
  const ground = BABYLON.MeshBuilder.CreateGround(
    "ground",
    { width: 300, height: 300 }, // 300x300 meter game world
    scene
  );
  ground.position.y = 0; // Keep at ground level
  ground.material = new BABYLON.StandardMaterial("groundMaterial", scene);
  ground.material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
  ground.material.reflectionTexture = new BABYLON.Texture(
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDU0IDU0IiBmaWxsPSJub25lIiBmaWxsLW9wYWNpdHk9V2hpdGUgYmx1ZSI+PHBhdGggZD0iTTUwLDB6IiBmaWxsPSJub25lIi8+IiBmaWxsLXJ1bGU9ImV2ZW50IiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiLz48L3N2Zz4=",
    scene
  );

  // Skybox for better visualization
  const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
  const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
  skyboxMaterial.backFaceCulling = false;
  skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(
    "textures/skybox", // Placeholder - would be actual skybox textures
    scene
  );
  skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
  skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
  skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
  skybox.material = skyboxMaterial;

  // HUD - position display element (created here but updated in main render loop)
  const hudElement = document.createElement("div");
  hudElement.style.position = "fixed";
  hudElement.style.bottom = "20px";
  hudElement.style.left = "20px";
  hudElement.style.width = "200px";
  hudElement.style.padding = "12px";
  hudElement.style.background = "rgba(0, 0, 0, 0.7)";
  hudElement.style.color = "#fff";
  hudElement.style.fontFamily = "sans-serif";
  hudElement.style.fontSize = "14px";
  hudElement.style.borderRadius = "4px";
  hudElement.style.zIndex = "1000";
  hudElement.innerHTML = "Position: --, --";
  document.body.appendChild(hudElement);

  return { scene, canvas, hudElement };
};

// Initialize Colyseus client for multiplayer
const initializeNetwork = (): Client => {
  // In development, connect to local server
  // In production, this would come from configuration
  return new Client("ws://localhost:2567");
};

// Main initialization function
const main = async () => {
  try {
    // 1. Initialize rendering engine
    const engine = initializeEngine();

    // 2. Create scene
    const { scene: scene, hudElement } = createScene(engine);

    // 3. Initialize world generator with mock data
    const mockWorldData = {
      roads: [],
      buildings: [],
      pois: [],
      bounds: { min: { x: 0, y: 0 }, max: { x: 300, y: 300 } }
    };
    const worldGenerator = new WorldGenerator(mockWorldData);
    // Generate the complete world across 9 sectors
    worldGenerator.generateWorld();

    // 4. Initialize network client
    const networkClient = initializeNetwork();

    // 5. Main render loop
    engine.runRenderLoop(() => {
      scene.render();
      hudElement.innerHTML = `Position: ${scene.activeCamera.position.x.toFixed(1)}, ${scene.activeCamera.position.z.toFixed(1)}`;
    });

    // 6. Handle window resizing
    window.addEventListener("resize", () => {
      engine.resize();
    });

    console.log("SKYLINE client initialized successfully");
    console.log("Engine:", engine);
    console.log("Scene:", scene);
    console.log("Network client:", networkClient);

  } catch (error) {
    console.error("Failed to initialize SKYLINE client:", error);
    // In a real game, we would show an error screen to the user
  }
};

// Start the application when the DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}