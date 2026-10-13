/**
 * Role: bounds-checked little-endian reader for protocol frames; every overflow becomes a typed ProtocolDecodeError.
 * Owner: backend
 */

import { ProtocolDecodeError } from '../protocol-errors.ts';

export class FrameReader {
  private offset = 0;
  private readonly view: DataView;

  constructor(private readonly bytes: Uint8Array) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  private take(size: number, what: string): number {
    if (this.offset + size > this.view.byteLength) throw new ProtocolDecodeError('truncated', `missing bytes for ${what}`);
    const at = this.offset;
    this.offset += size;
    return at;
  }

  u8(what: string): number {
    return this.view.getUint8(this.take(1, what));
  }
  i8(what: string): number {
    return this.view.getInt8(this.take(1, what));
  }
  u16(what: string): number {
    return this.view.getUint16(this.take(2, what), true);
  }
  i16(what: string): number {
    return this.view.getInt16(this.take(2, what), true);
  }
  u32(what: string): number {
    return this.view.getUint32(this.take(4, what), true);
  }
  i32(what: string): number {
    return this.view.getInt32(this.take(4, what), true);
  }
  f64(what: string): number {
    const value = this.view.getFloat64(this.take(8, what), true);
    if (!Number.isFinite(value)) throw new ProtocolDecodeError('out-of-range', `${what} is not finite`);
    return value;
  }

  /** Remaining bytes (used by MessagePack payloads). */
  rest(): Uint8Array {
    const out = this.bytes.subarray(this.offset);
    this.offset = this.bytes.byteLength;
    return out;
  }

  end(): void {
    if (this.offset !== this.view.byteLength) throw new ProtocolDecodeError('trailing-bytes', `${this.view.byteLength - this.offset} unexpected bytes`);
  }
}
