import * as BABYLON from "babylonjs";
import { Client } from "colyseus.js";

// Basic Babylon.js scene setup
const createScene = (engine: BABYLON.Engine) => {
  const scene = new BABYLON.Scene(engine);

  // Camera
  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    Math.PI / 2,
    Math.PI / 3,
    10,
    BABYLON.Vector3.Zero(),
    scene
  );
  camera.attachControl(true);

  // Light
  const light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );

  // Ground
  const ground = BABYLON.MeshBuilder.CreateGround(
    "ground",
    { width: 6, height: 6 },
    scene
  );

  return scene;
};

// Initialize Babylon.js
const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new BABYLON.Engine(canvas, true);
const scene = createScene(engine);

// Main render loop
engine.runRenderLoop(() => {
  scene.render();
});

// Resize
window.addEventListener("resize", () => {
  engine.resize();
});

// Basic Colyseus client setup (to be expanded)
const client = new Client("ws://localhost:2567");

console.log("SKYLINE client initialized");