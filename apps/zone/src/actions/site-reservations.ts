/**
 * Role: capacity of the action sites of a cell: a request reserves one slot of a site kind at a place (a stool at a garba stand, a pew) and releases it when its action ends.
 * Owner: backend
 */

export class SiteReservations {
  private readonly used = new Map<string, number>();
  private readonly byRequest = new Map<string, string>();

  private static key(placeId: string, kind: string): string {
    return `${placeId}#${kind}`;
  }

  free(placeId: string, kind: string, capacity: number): number {
    return capacity - (this.used.get(SiteReservations.key(placeId, kind)) ?? 0);
  }

  /** False when the site is full; a request holds at most one slot. */
  reserve(requestId: string, placeId: string, kind: string, capacity: number): boolean {
    if (this.byRequest.has(requestId)) return true;
    if (this.free(placeId, kind, capacity) <= 0) return false;
    const key = SiteReservations.key(placeId, kind);
    this.used.set(key, (this.used.get(key) ?? 0) + 1);
    this.byRequest.set(requestId, key);
    return true;
  }

  release(requestId: string): void {
    const key = this.byRequest.get(requestId);
    if (!key) return;
    this.byRequest.delete(requestId);
    const n = (this.used.get(key) ?? 1) - 1;
    if (n <= 0) this.used.delete(key);
    else this.used.set(key, n);
  }
}
