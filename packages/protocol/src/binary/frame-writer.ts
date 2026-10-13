/**
 * Role: fixed-size little-endian writer for protocol frames (sizes are known before encoding, no growth).
 * Owner: backend
 */

export class FrameWriter {
  private offset = 0;
  private readonly bytes: Uint8Array;
  private readonly view: DataView;

  constructor(size: number) {
    this.bytes = new Uint8Array(size);
    this.view = new DataView(this.bytes.buffer);
  }

  u8(v: number): this {
    this.view.setUint8(this.offset, v);
    this.offset += 1;
    return this;
  }
  i8(v: number): this {
    this.view.setInt8(this.offset, v);
    this.offset += 1;
    return this;
  }
  u16(v: number): this {
    this.view.setUint16(this.offset, v, true);
    this.offset += 2;
    return this;
  }
  i16(v: number): this {
    this.view.setInt16(this.offset, v, true);
    this.offset += 2;
    return this;
  }
  u32(v: number): this {
    this.view.setUint32(this.offset, v, true);
    this.offset += 4;
    return this;
  }
  i32(v: number): this {
    this.view.setInt32(this.offset, v, true);
    this.offset += 4;
    return this;
  }
  f64(v: number): this {
    this.view.setFloat64(this.offset, v, true);
    this.offset += 8;
    return this;
  }

  done(): Uint8Array {
    if (this.offset !== this.bytes.byteLength)
      throw new Error(`frame size mismatch: wrote ${this.offset} of ${this.bytes.byteLength}`);
    return this.bytes;
  }
}
