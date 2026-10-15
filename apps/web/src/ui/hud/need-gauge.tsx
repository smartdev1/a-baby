/**
 * Role: need-gauge — jauge unique pour un besoin (faim, énergie, hygiène, social, divertissement).
 * Owner: frontend
 *
 * Révèle un pourcentage 0-100 avec :
 * - Barre de fond colorisée (vert → jaune → rouge selon seuil)
 * - Label icône i18n
 * - Valeur numérique ARIA
 *
 * Décline 5 fois dans le HUD principal.
 *
 * Règles :
 * - Tout label = clé i18n (`hud.needs.<name>`)
 * - Couleurs : green (≥ 70), amber (≥ 30, < 70), red (< 30)
 * - Pas de `Math.random`
 * - ARIA complet : `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`
 */

import { h } from 'preact';
import { render } from 'preact';
import {
  hungerSignal,
  energySignal,
  hygieneSignal,
  socialSignal,
  entertainmentSignal,
} from './use-hud-store.ts';

// Mapping from need key to signal
const NEED_SIGNALS = {
  hunger: hungerSignal,
  energy: energySignal,
  hygiene: hygieneSignal,
  social: socialSignal,
  entertainment: entertainmentSignal,
};

const NEED_TEXTS = {
  hunger: 'hunger',
  energy: 'energy',
  hygiene: 'hygiene',
  social: 'social',
  entertainment: 'entertainment',
};

// Couleurs selon seuil
const NEED_COLORS = {
  green: '#22c55e', // ≥ 70
  amber: '#eab308', // ≥ 30, < 70
  red: '#ef4444',   // < 30,
};

/** Composant jauge unique – reçu `needKey` ("hunger"|"energy"|"hygiene"|"social"|"entertainment") */
const NeedGauge = ({ needKey }: { needKey: keyof typeof NEED_SIGNALS }): JSX.Element => {
  const signalRef = NEED_SIGNALS[needKey];

  // Read the signal value – Preact will track this dependency and re-render
  // when the signal changes, making this component reactive.
  const value = signalRef.value;

  // Ensure value is clamped 0-100
  const clampedValue = Math.max(0, Math.min(100, value));
  const labelKey = NEED_TEXTS[needKey];

  const getColor = (v: number): string => {
    if (v >= 70) return NEED_COLORS.green;
    if (v >= 30) return NEED_COLORS.amber;
    return NEED_COLORS.red;
  };

  return h('div', {
    role: 'progressbar',
    'aria-valuenow': clampedValue,
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    'aria-label': labelKey,
    style: {
      width: '100%',
      height: '16px',
      backgroundColor: '#e2e8f0',
      borderRadius: '4px',
      overflow: 'hidden',
      position: 'relative',
      // Note: reactive update would happen via parent re-rendering this component
    },
    children: [
      h('div', {
        style: {
          width: `${clampedValue}%`,
          height: '100%',
          backgroundColor: getColor(clampedValue),
          transition: 'width 0.2s ease, background-color 0.2s ease',
        },
      }),
      h('div', {
        style: {
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          color: '#1e293b',
          fontSize: '0.75rem',
        },
        children: [
          h('span', { style: { textAlign: 'center', display: 'block' } }, labelKey),
          h('span', { style: { textAlign: 'center' } }, `${clampedValue}%`),
        ],
      }),
    ],
  });
};

/** Point d'entrée rendu : monte la jauge dans le DOM */
export const renderNeedGauge = (target: HTMLElement, needKey: keyof typeof NEED_SIGNALS) => {
  // Render the component; parent will handle reactive re-renders via signal changes
  const container = document.createElement('div');
  target.appendChild(container);
  render(h(NeedGauge, { needKey }), container);
  return container;
};