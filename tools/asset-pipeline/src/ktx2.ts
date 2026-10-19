/**
 * Role: checks that a glTF document declares KTX2 texture extension.
 * Owner: frontend
 */

export function hasKtx2Extension(extensions: readonly string[]): boolean {
  return extensions.includes('KHR_texture_basisu');
}

export function validateKtx2(extensions: readonly string[]): { ok: boolean; reason?: string } {
  if (!hasKtx2Extension(extensions)) {
    return { ok: false, reason: 'missing KHR_texture_basisu (KTX2)' };
  }
  return { ok: true };
}
