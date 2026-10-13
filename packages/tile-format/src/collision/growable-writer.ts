/**
 * Role: little-endian binary writer that grows its buffer as needed, used to encode collision.bin.
 * Owner: backend
 */

export class GrowableWriter {
  private bytes_ = new Uint8Array(1024);
  private view = new DataView(this.bytes_.buffer);
  private length = 0;

  private reserve(size: number): number {
    if (this.length + size > this.bytes_.byteLength) {
      const next = new Uint8Array(Math.max(this.bytes_.byteLength * 2, this.length + size));
      next.set(this.bytes_.subarray(0, this.length));
      this.bytes_ = next;
      this.view = new DataView(next.buffer);
    }
    const at = this.length;
    this.length += size;
    return at;
  }

  u16(value: number): void {
    const at = this.reserve(2); // reserve first: it may replace this.view
    this.view.setUint16(at, value, true);
  }

  u32(value: number): void {
    const at = this.reserve(4); // reserve first: it may replace this.view
    this.view.setUint32(at, value, true);
  }

  f32(value: number): void {
    const at = this.reserve(4); // reserve first: it may replace this.view
    this.view.setFloat32(at, value, true);
  }

  f32Array(values: Float32Array): void {
    const at = this.reserve(values.length * 4);
    values.forEach((v, k) => this.view.setFloat32(at + k * 4, v, true));
  }

  u8(value: number): void {
    const at = this.reserve(1);
    this.view.setUint8(at, value);
  }

  bytes(values: Uint8Array): void {
    const at = this.reserve(values.length);
    this.bytes_.set(values, at);
  }

  ascii(text: string): void {
    const at = this.reserve(text.length);
    for (let k = 0; k < text.length; k++) this.view.setUint8(at + k, text.charCodeAt(k));
  }

  toBytes(): Uint8Array {
    return this.bytes_.slice(0, this.length);
  }
}
