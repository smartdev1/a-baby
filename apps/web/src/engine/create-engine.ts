/**
 * Role: creates the Babylon engine and the base scene (sky colour, ambient and sun lights).
 * Owner: frontend
 */

import { Engine } from '@babylonjs/core/Engines/engine';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';

export const createEngine = (canvas: HTMLCanvasElement): Engine =>
  new Engine(canvas, true, { stencil: true, preserveDrawingBuffer: false });

export const createScene = (engine: Engine): Scene => {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.53, 0.81, 0.98, 1);

  const ambient = new HemisphericLight('ambient', new Vector3(0, 1, 0), scene);
  ambient.intensity = 0.7;
  ambient.groundColor = new Color3(0.35, 0.33, 0.3);

  const sun = new DirectionalLight('sun', new Vector3(-0.5, -1, -0.4), scene);
  sun.intensity = 0.7;

  return scene;
};
