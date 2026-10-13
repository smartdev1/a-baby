import * as BABYLON from "babylonjs";
import { Client } from "colyseus.js";
import { WorldGenerator } from "packages/world-generator";

// Initialize Babylon.js engine
const initializeEngine = (): BABYLON.Engine => {
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
  return new BABYLON.Engine(canvas, true);
};

// Create basic scene with lighting
const createScene = (engine: BABYLON.Engine): BABYLON.Scene => {
  const scene = new BABYLON.Scene(engine);

  // Camera setup - will be replaced by player-controlled camera later
  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    Math.PI / 2, // Beta (horizontal angle)
    Math.PI / 3, // Alpha (vertical angle)
    20,          // Radius
    BABYLON.Vector3.Zero(), // Target
    scene
  );

  // Attach camera to canvas controls
  camera.attachControl(canvas, true);

  // Lighting - hemispheric light for outdoor environment
  const light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0), // Direction (upwards)
    scene
  );
  light.intensity = 1.5;

  // Ground placeholder - will be replaced by procedural terrain
  const ground = BABYLON.MeshBuilder.CreateGround(
    "ground",
    { width: 50, height: 50 }, // 50x50 meter area for testing
    scene
  );
  ground.position.y = 0; // Keep at ground level

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

  return scene;
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
    const scene = createScene(engine);

    // 3. Initialize world generator (for MVP, we'll use it to generate test content)
    const worldGenerator = new WorldGenerator();
    // For now, generate a simple test sector
    // worldGenerator.generateSector("B2"); // Place sector

    // 4. Initialize network client
    const networkClient = initializeNetwork();

    // 5. Main render loop
    engine.runRenderLoop(() => {
      scene.render();
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