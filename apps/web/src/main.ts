import * as BABYLON from "babylonjs";
import { Client } from "colyseus.js";
import { WorldRenderer } from "./world/WorldRenderer";
import type { WorldData, PropData } from "./world/WorldRenderer";
import worldJson from "../../../packages/game-config/world.json";
import propsJson from "../../../packages/game-config/props.json";

const initializeEngine = (): BABYLON.Engine => {
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
  return new BABYLON.Engine(canvas, true);
};

const createScene = (engine: BABYLON.Engine): BABYLON.Scene => {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.53, 0.81, 0.98, 1); // sky, no skybox

  const ambient = new BABYLON.HemisphericLight("ambient", new BABYLON.Vector3(0, 1, 0), scene);
  ambient.intensity = 0.7;
  ambient.groundColor = new BABYLON.Color3(0.35, 0.33, 0.3);

  const sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-0.5, -1, -0.4), scene);
  sun.intensity = 0.7;

  return scene;
};

// Debug fly camera: WASD/ZQSD (physical keys), Q/E down/up, Shift = faster.
const createCamera = (scene: BABYLON.Scene, focus: BABYLON.Vector3): BABYLON.FreeCamera => {
  const canvas = scene.getEngine().getRenderingCanvas() as HTMLCanvasElement;

  const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(focus.x, 35, focus.z - 50), scene);
  camera.setTarget(focus);
  camera.minZ = 0.1;
  camera.maxZ = 800;
  camera.angularSensibility = 1500;
  camera.inputs.removeByType("FreeCameraKeyboardMoveInput");
  camera.attachControl(canvas, true); // mouse drag = look

  const keys = new Set<string>();
  window.addEventListener("keydown", (e) => keys.add(e.code));
  window.addEventListener("keyup", (e) => keys.delete(e.code));
  window.addEventListener("blur", () => keys.clear());

  scene.onBeforeRenderObservable.add(() => {
    const dt = scene.getEngine().getDeltaTime() / 1000;
    const speed = keys.has("ShiftLeft") ? 20 : 6; // m/s
    const yaw = camera.rotation.y;

    const forward = (keys.has("KeyW") ? 1 : 0) - (keys.has("KeyS") ? 1 : 0);
    const strafe = (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0);
    const vertical = (keys.has("KeyE") ? 1 : 0) - (keys.has("KeyQ") ? 1 : 0);

    camera.position.x += (Math.sin(yaw) * forward + Math.cos(yaw) * strafe) * speed * dt;
    camera.position.z += (Math.cos(yaw) * forward - Math.sin(yaw) * strafe) * speed * dt;
    camera.position.y = Math.max(1, camera.position.y + vertical * speed * dt);
  });

  return camera;
};

const createHud = (): HTMLDivElement => {
  const hud = document.createElement("div");
  Object.assign(hud.style, {
    position: "fixed",
    bottom: "20px",
    left: "20px",
    padding: "12px",
    background: "rgba(0, 0, 0, 0.7)",
    color: "#fff",
    fontFamily: "sans-serif",
    fontSize: "14px",
    borderRadius: "4px",
    zIndex: "1000",
  });
  hud.textContent = "Position: --, --";
  document.body.appendChild(hud);
  return hud;
};

const initializeNetwork = (): Client => new Client("ws://localhost:2567");

const main = async (): Promise<void> => {
  try {
    const engine = initializeEngine();
    const scene = createScene(engine);

    const renderer = new WorldRenderer(scene);
    const { center, stats } = renderer.build(
      worldJson as unknown as WorldData,
      propsJson as unknown as PropData[]
    );
    console.log("World built:", stats);

    const camera = createCamera(scene, center);
    const hud = createHud();
    const networkClient = initializeNetwork();

    engine.runRenderLoop(() => {
      scene.render();
      hud.textContent =
        `Position: ${camera.position.x.toFixed(1)}, ${camera.position.z.toFixed(1)} | ` +
        `${engine.getFps().toFixed(0)} FPS`;
    });

    window.addEventListener("resize", () => engine.resize());

    console.log("SKYLINE client initialized successfully", networkClient);
  } catch (error) {
    console.error("Failed to initialize SKYLINE client:", error);
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => void main());
} else {
  void main();
}