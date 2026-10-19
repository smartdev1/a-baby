/**
 * Role: tile-worker — Web Worker that fetches tile manifest and binary assets.
 * Owner: frontend
 *
 * Runs in a separate thread to fetch tile data from a local data directory (simulating CDN).
 * Receives tile keys via postMessage, fetches manifest and associated binary files,
 * and transfers ArrayBuffers back to the main thread.
 */

/**
 * Message types for communication with the worker
 */
interface TileWorkerRequest {
  type: 'loadTile';
  tileKey: string;
  baseUrl: string; // Base URL for tile data (e.g., '/tiles/')
}

/**
 * Tile manifest interface (matches TileMeta from tile-format)
 */
interface TileManifest {
  formatVersion: number;
  tileKey: string;
  buildings: Array<{
    id: string;
    type: string;
    levels: number;
    heightM: number;
    heightSource: string;
  }>;
  places: Array<{
    id: string;
    category: string;
    displayName: string | null;
    position: { x: number; z: number };
    buildingId: string | null;
  }>;
  neighbours: string[];
}

// Self is the global scope in a worker
self.onmessage = async (event: MessageEvent<TileWorkerRequest>) => {
  const { tileKey, baseUrl } = event.data;

  // Validate tileKey format
  if (!/^L0_-?\d+_-?\d+$/.test(tileKey)) {
    self.postMessage({
      type: 'error',
      tileKey,
      message: `Invalid tile key format: ${tileKey}`
    });
    return;
  }

  try {
    // Fetch tile manifest (JSON)
    const manifestUrl = `${baseUrl}${tileKey}/manifest.json`;
    const manifestResponse = await fetch(manifestUrl, { cache: 'no-store' });

    if (!manifestResponse.ok) {
      throw new Error(`Failed to fetch manifest: ${manifestResponse.status}`);
    }

    const manifest = (await manifestResponse.json()) as TileManifest;

    // Fetch binary assets (if they exist)
    const fetchBinary = async (filename: string): Promise<ArrayBuffer | null> => {
      try {
        const url = `${baseUrl}${tileKey}/${filename}`;
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
          // Binary files might not exist for all tiles - that's OK
          return null;
        }
        return await response.arrayBuffer();
      } catch (error) {
        console.warn(`Error fetching ${filename} for tile ${tileKey}:`, error);
        return null;
      }
    };

    // Fetch all three binary types in parallel
    const [glbSceneBuffer, instancesBuffer, collisionBuffer] = await Promise.all([
      fetchBinary('scene.glb'),
      fetchBinary('instances.bin'),
      fetchBinary('collision.bin')
    ]);

    // Transfer ArrayBuffers back to main thread
    self.postMessage({
      type: 'tileData',
      tileKey,
      manifest,
      glbScene: glbSceneBuffer ?? null,
      instances: instancesBuffer ?? null,
      collision: collisionBuffer ?? null
    });
  } catch (error) {
    console.error(`Error loading tile ${tileKey}:`, error);
    self.postMessage({
      type: 'error',
      tileKey,
      message: error instanceof Error ? error.message : String(error)
    });
  }
};