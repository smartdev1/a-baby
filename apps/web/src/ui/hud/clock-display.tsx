/**
 * Role: clock-display — affichage horique jour/nuit.
 * Owner: frontend
 *
 * Montre :
 * - gameMinute : minute de jeu interne
 * - serverTime : timestamp réel (epoch ms)
 * - clockRatio : facteur 12 (1 jour jeu = 2h réelle)
 *
 * Tout en i18n, pas de Math.random.
 *
 * Règles :
 * - Label = clé i18n (`hud.game_minute`, `hud.real_time`, `hud.clock_ratio`)
 * - Format déterministe, pas de `Math.random`
 * - ARIA : `role="timer"`, `aria-label` avec clé i18n
 */

import { h } from 'preact';
import { render } from 'preact';
import {
  gameMinuteSignal,
  serverTimeSignal,
  clockRatioSignal,
} from './use-hud-store.ts';

/** Format game minute : MM:SS depuis min */
const formatGameMinute = (minutes: number): string => {
  const m = Math.max(0, minutes);
  const sec = ((m * 60) % 60).toString().padStart(2, '0');
  const min = Math.floor(m).toString().padStart(2, '0');
  return `${min}:${sec}`;
};

/** Format server time : HH:MM */
const formatServerTime = (epochMs: number): string => {
  const d = new Date(epochMs);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};

/** Composant affichage horique */
const ClockDisplay = (): JSX.Element => {
  // Read signal values with explicit typing
const gameMinute = gameMinuteSignal.value;
const serverTime = serverTimeSignal.value;
const clockRatio = clockRatioSignal.value;

  const formattedGameMinute = formatGameMinute(gameMinute);
  const formattedServerTime = formatServerTime(serverTime);

  return h('div', {
    'aria-role': 'timer',
    'aria-label': 'hud.game_minute',
    style: {
      fontSize: '1.25rem',
      fontWeight: 'medium',
      textAlign: 'center',
      color: '#1e293b',
    },
    children: [
      h('div', {
        style: {
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '4px',
        },
        children: [
          h('span', {}, formattedGameMinute),
          h('span', { style: { fontSize: '0.75rem', color: '#64748b' } }, 'hud.game_minute'),
        ],
      }),
      h('div', {
        style: {
          fontSize: '1rem',
          marginTop: '4px',
        },
        children: [
          h('span', {}, formattedServerTime),
          h('span', { style: { color: '#64748b' } }, 'hud.real_time'),
        ],
      }),
      h('div', {
        style: {
          fontSize: '0.85rem',
          marginTop: '4px',
          color: '#64748b',
        },
        children: [
          h('span', {}, `ratio ${clockRatio}x`),
          h('span', { style: { color: '#64748b' } }, 'hud.clock_ratio'),
        ],
      }),
    ],
  });
};

/** Point d'entrée rendu : monte l'affichage horique dans le DOM */
export const renderClockDisplay = (target: HTMLElement) => {
  const container = document.createElement('div');
  target.appendChild(container);
  render(h(ClockDisplay, null), container);
  return container;
};