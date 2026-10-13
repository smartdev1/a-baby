/**
 * Role: little-endian binary writer that grows its buffer as needed, used to encode collision.bin.
 * Owner: backend
 */

export class GrowableWriter {
  private bytes = new Uint8Array(1024);
  private view = new DataView(this.bytes.buffer);
  private length = 0;

  private reserve(size: number): number {
    if (this.length + size > this.bytes.byteLength) {
      const next = new Uint8Array(Math.max(this.bytes.byteLength * 2, this.length + size));
      next.set(this.bytes.subarray(0, this.length));
      this.bytes = next;
      this.view = new DataView(next.buffer);
    }
    const at = this.length;
    this.length += size;
    return at;
  }

  u16(value: number): void {
    this.view.setUint16(this.reserve(2), value, true);
  }

  u32(value: number): void {
    this.view.setUint32(this.reserve(4), value, true);
  }

  f32(value: number): void {
    this.view.setFloat32(this.reserve(4), value, true);
  }

  f32Array(values: Float32Array): void {
    const at = this.reserve(values.length * 4);
    values.forEach((v, k) => this.view.setFloat32(at + k * 4, v, true));
  }

  ascii(text: string): void {
    const at = this.reserve(text.length);
    for (let k = 0; k < text.length; k++) this.view.setUint8(at + k, text.charCodeAt(k));
  }

  toBytes(): Uint8Array {
    return this.bytes.slice(0, this.length);
  }
}
