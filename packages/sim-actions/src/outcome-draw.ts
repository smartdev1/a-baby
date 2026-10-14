/**
 * Role: deterministic weighted draw of an action outcome from its request id (FNV-1a hash): the same request always gives the same outcome, on the server and in a replay; no Math.random.
 * Owner: backend
 */

/** Uniform number in [0, 1) from a string. */
export const unitHash = (text: string): number => {
  let h = 2_166_136_261;
  for (let k = 0; k < text.length; k++) h = Math.imul(h ^ text.charCodeAt(k), 16_777_619) >>> 0;
  // Final avalanche so close request ids spread over the whole range.
  h = Math.imul(h ^ (h >>> 15), 2_246_822_507) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3_266_489_909) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4_294_967_296;
};

/** Index of the drawn entry, or -1 for an empty list. */
export const drawWeighted = (weights: readonly number[], seed: string): number => {
  const total = weights.reduce((s, w) => s + w, 0);
  if (weights.length === 0 || total <= 0) return -1;
  let ticket = unitHash(seed) * total;
  for (let k = 0; k < weights.length; k++) {
    ticket -= weights[k] ?? 0;
    if (ticket < 0) return k;
  }
  return weights.length - 1;
};
