/**
 * Role: handshake rule: a `hello` with another protocol version is refused with a `version_mismatch` error message.
 * Owner: backend
 */

import type { HelloMessage, ServerErrorMessage } from './messages/control-schemas.ts';
import { PROTOCOL_VERSION } from './protocol-version.ts';

/** Returns the error to send back, or null when the client speaks this protocol version. */
export const checkHello = (hello: HelloMessage): ServerErrorMessage | null =>
  hello.protocolVersion === PROTOCOL_VERSION
    ? null
    : { code: 'version_mismatch', message: `server speaks protocol ${PROTOCOL_VERSION}, client sent ${hello.protocolVersion}` };
