/**
 * Role: tests the OPL parsing of route relations (escapes, missing tags, non-relation lines).
 * Owner: backend
 */

import { describe, expect, it } from 'vitest';
import { parseRouteRelations } from './bus-routes.ts';

describe('parseRouteRelations', () => {
  it('should decode OPL escapes and read route, ref, name and network', () => {
    const opl =
      "r10173633 v1 dV c0 t i0 u Tname=Bus%20%37:%20%Gare%20%Sud,network=Gbaka%20%d'Adjamé,ref=37,route=bus,type=route Mw1@";
    expect(parseRouteRelations(opl)).toEqual([
      { id: 'r10173633', route: 'bus', ref: '37', name: 'Bus 37: Gare Sud', network: "Gbaka d'Adjamé" },
    ]);
  });

  it('should ignore node and way lines and tolerate missing tags', () => {
    const opl = ['n1 v1 T', 'w2 v1 Thighway=residential', 'r3 v1 Troute=share_taxi M'].join('\n');
    expect(parseRouteRelations(opl)).toEqual([{ id: 'r3', route: 'share_taxi', ref: null, name: null, network: null }]);
  });
});
