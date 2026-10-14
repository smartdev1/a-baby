/**
 * Role: djai-display — affichage du solde Djai.
 * Owner: frontend
 *
 * Affichage du bigint djaiBalanceSignal avec formatage devise i18n.
 * Déterministe, pas de Math.random.
 *
 * Règles :
 * - Label = clé i18n (`hud.djai_balance`)
 * - Format bigint avec espaces tous les 3 chiffres (ex. 1 234 567 Djai)
 * - Couleurs : green si positif, gray si zéro
 * - ARIA : `role="status"`, `aria-label` avec clé i18n
 */

import { h } from 'preact';
import { render } from 'preact';
import { djaiBalanceSignal } from './use-hud-store.ts';

/** Format bigint avec séparateurs milliers + suffix "Djai" */
const formatBigint = (value: bigint): string => {
  const abs = value < 0n ? -value : value;
  const formatted = abs.toLocaleString('fr-FR'); // e.g. "1 234 567"
  const sign = value < 0n ? '-' : '';
  return `${sign}${formatted} Djai`;
};

/** Composant affichage solde Djai */
const DjaiDisplay = (): JSX.Element => {
  const value = djaiBalanceSignal.value;

  const getColor = (): string => (value > 0n || value === 0n ? '#1e293b' : '#64748b');

  return h('div', {
    'aria-role': 'status',
    'aria-label': 'hud.djai_balance',
    style: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      textAlign: 'center',
      color: getColor(),
    },
    children: [
      h('span', {}, formatBigint(value)),
      h('div', {
        style: {
          fontSize: '0.75rem',
          textAlign: 'center',
          marginTop: '4px',
          color: '#64748b',
        },
        children: [
          h('span', { 'aria-hidden': 'true' }, 'hud.djai_balance'),
        ],
      }),
    ],
  });
};

/** Point d'entrée rendu : monte l'affichage Djai dans le DOM */
export const renderDjaiDisplay = (target: HTMLElement) => {
  const container = document.createElement('div');
  target.appendChild(container);
  render(h(DjaiDisplay, null), container);
  return container;
};