/**
 * Role: little-endian binary reader that checks every read against the buffer end and throws a typed error instead of reading out of bounds.
 * Owner: backend
 */

export type CollisionDecodeErrorCode = 'truncated' | 'bad-magic' | 'unsupported-version' | 'out-of-range' | 'trailing-bytes' | 'invalid-value';

export class CollisionDecodeError extends Error {
  override readonly name = 'CollisionDecodeError';
  constructor(
    readonly code: CollisionDecodeErrorCode,
    message: string,
  ) {
    super(`collision.bin: ${message}`);
  }
}

export class BoundedReader {
  private offset = 0;
  private readonly view: DataView;

  constructor(bytes: Uint8Array) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  get remaining(): number {
    return this.view.byteLength - this.offset;
  }

  private take(size: number, what: string): number {
    if (size > this.remaining) throw new CollisionDecodeError('truncated', `needs ${size} bytes for ${what}, ${this.remaining} left`);
    const at = this.offset;
    this.offset += size;
    return at;
  }

  u16(what: string): number {
    return this.view.getUint16(this.take(2, what), true);
  }

  u32(what: string): number {
    return this.view.getUint32(this.take(4, what), true);
  }

  f32(what: string): number {
    const value = this.view.getFloat32(this.take(4, what), true);
    if (!Number.isFinite(value)) throw new CollisionDecodeError('invalid-value', `${what} is not a finite number`);
    return value;
  }

  f32Array(count: number, what: string): Float32Array {
    const at = this.take(count * 4, what);
    const out = new Float32Array(count);
    for (let k = 0; k < count; k++) {
      const value = this.view.getFloat32(at + k * 4, true);
      if (!Number.isFinite(value)) throw new CollisionDecodeError('invalid-value', `${what}[${k}] is not a finite number`);
      out[k] = value;
    }
    return out;
  }

  u8(what: string): number {
    return this.view.getUint8(this.take(1, what));
  }

  bytes(length: number, what: string): Uint8Array {
    const at = this.take(length, what);
    return new Uint8Array(this.view.buffer.slice(this.view.byteOffset + at, this.view.byteOffset + at + length));
  }

  ascii(length: number, what: string): string {
    const at = this.take(length, what);
    let text = '';
    for (let k = 0; k < length; k++) text += String.fromCharCode(this.view.getUint8(at + k));
    return text;
  }
}
