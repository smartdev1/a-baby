/**
 * Role: guest-home — écran d'accueil invité.
 * Owner: frontend
 *
 * Écran affiché lorsqu'un joueur rejoint en invité (sans inscription).
 * Montre les options principales : commencer une nouvelle partie,
 * récupérer une sauvegarde existante avec un code, ou consulter les mentions légales.
 *
 * Règles :
 * - Tout texte = clé i18n (`guest.*.<sous_champ>`)
 * - 3 options principales présentées de façon équilibrée
 * - Boutons d'action avec labels i18n
 * - Pas de `Math.random`
 * - ARIA : `role="main"`, `aria-label` avec clé i18n
 */

import { h } from 'preact';
import { render } from 'preact';

/** Composant écran d'accueil invité */
const GuestHome = (): JSX.Element => {
  const baseStyle = {
    padding: '32px',
    maxWidth: '600px',
    margin: '0 auto',
    textAlign: 'center',
    fontFamily: 'system-ui, sans-serif',
  };

  const buttonStyle = {
    width: '100%',
    maxWidth: '300px',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: 'medium',
    cursor: 'pointer',
  };

  return h('div', {
    'aria-role': 'main',
    'aria-label': 'guest.title',
    style: baseStyle,
    children: [
      h('h1', {
        style: {
          fontSize: '2rem',
          fontWeight: 'bold',
          marginBottom: '16px',
          color: '#1e293b',
        },
        children: [h('span', {}, 'guest.title_main')],
      }),
      h('p', {
        style: {
          margin: '0 0 32px 0',
          fontSize: '1.125rem',
          color: '#64748b',
          lineHeight: '1.6',
        },
        children: [h('span', {}, 'guest.subtitle')],
      }),

      h('div', {
        style: {
          margin: '16px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          alignItems: 'center',
        },
        children: [
          // Bouton : Nouvelle partie
          h('button', {
            style: { ...buttonStyle, backgroundColor: '#3b82f6', color: 'white' },
            'aria-label': 'guest.new_game',
            children: [h('span', {}, 'guest.new_game')],
          }),

          // Bouton : Récupérer avec code
          h('button', {
            style: { ...buttonStyle, backgroundColor: '#10b981', color: 'white' },
            'aria-label': 'guest.recover',
            children: [h('span', {}, 'guest.recover')],
          }),

          // Bouton : Mentions légales
          h('button', {
            style: { ...buttonStyle, backgroundColor: '#f59e0b', color: 'white' },
            'aria-label': 'guest.legal',
            children: [h('span', {}, 'guest.legal')],
          }),
        ],
      }),
    ],
  });
};

/** Point d'entrée rendu : monte l'écran d'accueil invité dans le DOM */
export const renderGuestHome = (target: HTMLElement) => {
  const container = document.createElement('div');
  target.appendChild(container);
  render(h(GuestHome), container);
};