/**
 * Role: validates asset file names against the `categorie_nom_variante_lod` convention.
 * Owner: frontend
 */

const NAME_RE = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)+_lod[0-9]+$/;

export function isValidName(name: string): boolean {
  return NAME_RE.test(name);
}

export function validateName(name: string): { ok: boolean; reason?: string } {
  if (!isValidName(name)) {
    return {
      ok: false,
      reason: `name "${name}" must match categorie_nom_variante_lod (lowercase, underscores)`,
    };
  }
  return { ok: true };
}
