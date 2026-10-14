/**
 * Role: composition root of the web client: creates the engine and scene, wires debug tools and the tile loader, starts the frame loop.
 * Owner: frontend
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { createEngine, createScene } from '../engine/create-engine.ts';
import { createFlyCamera } from '../debug/fly-camera.ts';
import { createPerfOverlay } from '../debug/perf-overlay.ts';
import { loadAndRenderTile, type TileLoaderMetrics } from '../debug/tile-loader.ts';
import { rawToIntent } from '../input/keyboard-intent.ts';
import { renderNeedGauge } from '../ui/hud/need-gauge.tsx';
import { renderDjaiDisplay } from '../ui/hud/djai-display.tsx';
import { renderClockDisplay } from '../ui/hud/clock-display.tsx';
import { renderInteractionPrompt } from '../ui/hud/interaction-prompt.tsx';
import { renderNotificationBanner } from '../ui/hud/notification-banner.tsx';

// HUD rendering elements (created once at startup)
let djaiDisplayContainer: HTMLElement | null = null;
let clockDisplayContainer: HTMLElement | null = null;
let needGaugeContainers: HTMLElement[] = [];  // ADD THIS
let interactionPromptContainer: HTMLElement | null = null;  // ADD THIS
let notificationBannerContainer: HTMLElement | null = null;  // ADD THIS

// Render all HUD components once at startup
const initHUD = (): void => {
  // Need gauges (5) — target a shared HUD container
  const hudTarget = document.getElementById('ui-root')!;
  needGaugeContainers = ['hunger', 'energy', 'hygiene', 'social', 'entertainment'].map((needKey) => {
    const container = document.createElement('div');
    hudTarget.appendChild(container);
    renderNeedGauge(container, needKey as 'hunger' | 'energy' | 'hygiene' | 'social' | 'entertainment');
    return container;
  });

  // Djai display
  djaiDisplayContainer = renderDjaiDisplay(hudTarget);

  // Clock display
  clockDisplayContainer = renderClockDisplay(hudTarget);

  // Interaction prompt
  interactionPromptContainer = renderInteractionPrompt(hudTarget);

  // Notification banner
  notificationBannerContainer = renderNotificationBanner(hudTarget);
};

const start = async (): Promise<void> => {
  const canvas = document.getElementById('render-canvas');
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error('#render-canvas not found');

  const engine = createEngine(canvas);
  const scene = createScene(engine);

  // ---- Input system J1 : clavier → InputIntent (pur, testable) ---
  const keyState = new Set<string>();
  window.addEventListener('keydown', (e) => keyState.add(e.code));
  window.addEventListener('keyup', (e) => keyState.delete(e.code));

  // Initialize HUD
  initHUD();

  // No world loaded yet (tile loader: T-014): look at the scene origin.
  const camera = createFlyCamera(scene, new Vector3(0, 50, -100));
  new HemisphericLight('light', new Vector3(0, 1, 0), scene); 
  const overlay = createPerfOverlay(document.body);

  // Chargement fixture tile L0 — remplace l'ancien WorldRenderer.ts statique
  // Le manifeste et les tuiles sont produits par le pipeline T-012 (tile-cut/encode/manifest)
  const fixtureTileKey = 'L0_0_0'; // TODO: charger depuis leharness T-020 / config
  let tileMetrics: TileLoaderMetrics | undefined;
  try {
    tileMetrics = await loadAndRenderTile(fixtureTileKey, scene);
    console.log(`[TILE LOADER] Fixture loaded: ${tileMetrics.buildingsRendered} buildings, ${tileMetrics.placesRendered} places, ${tileMetrics.loadTimeMs}ms`);
  } catch (e) {
    console.error('[TILE LOADER] Failed to load fixture tile:', e);
    // Continuer sans tile — la scène de base s'affichera tout de même
  }

  void engine.runRenderLoop(() => {
    // Mise à jour de l'intention clavier chaque frame (J1)
    rawToIntent(keyState);
    // TODO : passer currentIntent à la prédiction locale / au système de personnage
    // pour que le joueur bouge sans attendre le serveur à chaque frame.

    // Update HUD signals from game state (these would come from WebSocket messages in real gameplay)
    // For now, just overlay update
    overlay.update(camera.position, engine.getFps());
  });
  window.addEventListener('resize', () => {
    engine.resize();
    // Re-render HUD on resize to adjust positions
    if (djaiDisplayContainer) {
      const parent = djaiDisplayContainer.parentElement;
      if (parent) renderDjaiDisplay(parent);
    }
    if (clockDisplayContainer) {
      const parent = clockDisplayContainer.parentElement;
      if (parent) renderClockDisplay(parent);
    }
  });
};

try {
  start().catch((error: unknown) => {
    console.error('SkyLine client failed to start', error);
  });
} catch (error: unknown) {
  console.error('SkyLine client failed to start', error);
}