/**
 * Role: checks that a glTF document declares meshopt compression extension.
 * Owner: frontend
 */

export function hasMeshoptExtension(extensions: readonly string[]): boolean {
  return extensions.includes('EXT_meshopt_compression');
}

export function validateMeshopt(extensions: readonly string[]): { ok: boolean; reason?: string } {
  if (!hasMeshoptExtension(extensions)) {
    return { ok: false, reason: 'missing EXT_meshopt_compression (meshopt)' };
  }
  return { ok: true };
}
