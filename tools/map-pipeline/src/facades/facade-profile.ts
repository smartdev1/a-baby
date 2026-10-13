/**
 * Role: facade profile of a building (commercial, apartment block, courtyard house, public, industrial) from its OSM type, place category and levels; it selects the grammar and the roof odds.
 * Owner: backend
 */

import type { BuildingRecord } from '../records/map-records.ts';

export type FacadeProfile = 'commercial' | 'apartments' | 'courtyard' | 'public' | 'industrial';

const INDUSTRIAL_TYPES = new Set(['industrial', 'warehouse', 'factory', 'hangar', 'garage', 'garages', 'shed', 'storage_tank', 'service', 'transformer_tower']);
const PUBLIC_TYPES = new Set(['school', 'university', 'college', 'kindergarten', 'hospital', 'public', 'civic', 'government', 'church', 'cathedral', 'chapel', 'mosque', 'temple', 'stadium', 'sports_hall', 'fire_station', 'train_station', 'transportation']);
const COMMERCIAL_TYPES = new Set(['retail', 'commercial', 'kiosk', 'supermarket', 'shop', 'office', 'hotel']);
const PUBLIC_CATEGORY = /^(education|worship|public|health\.(hospital|clinic)|sport\.(stadium|centre))/;
const COMMERCIAL_CATEGORY = /^(commerce|food|beauty|services|finance|craft|lodging|health\.(pharmacy|optician))/;

export const facadeProfileOf = (b: Pick<BuildingRecord, 'type' | 'levels' | 'placeCategory'>): FacadeProfile => {
  if (INDUSTRIAL_TYPES.has(b.type)) return 'industrial';
  if (PUBLIC_TYPES.has(b.type) || PUBLIC_CATEGORY.test(b.placeCategory ?? '')) return 'public';
  if (COMMERCIAL_TYPES.has(b.type) || COMMERCIAL_CATEGORY.test(b.placeCategory ?? '')) return 'commercial';
  if (b.type === 'apartments' || b.levels >= 3) return 'apartments';
  return 'courtyard';
};
