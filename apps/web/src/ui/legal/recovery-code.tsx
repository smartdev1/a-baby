/**
 * Role: recovery-code — écran de code de récupération.
 * Owner: frontend
 *
 * Affiche le code de récupération du joueur pour restaurer sa session.
 * Le code est généré côté serveur et affiché ici en lecture seule.
 *
 * Règles :
 * - Code affiché en caractère police monospace pour lisibilité
 * - Bouton de copie dans le presse-papiers (navigator.clipboard.writeText)
 * - Tout texte = clé i18n (`hud.recovery_code`)
 * - Pas de `Math.random`
 * - ARIA : `role="status"`, `aria-label` avec clé i18n
 */

import { h, render } from 'preact';

/** Composant écran de code de récupération */
const RecoveryCode = (): JSX.Element => {
  // Code de récupération exemple - en vrai, ceci viendrait du serveur
  const recoveryCode = 'SKY-1234-ABCD-EFGH';

  return h('div', {
    'aria-role': 'status',
    'aria-label': 'hud.recovery_code',
    style: {
      padding: '24px',
      maxWidth: '400px',
      margin: '0 auto',
      textAlign: 'center',
      fontFamily: 'SF Mono, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      marginBottom: '16px',
    },
    children: [
      h('p', {
        style: {
          margin: '0 0 16px 0',
          fontSize: '0.875rem',
          color: '#64748b',
        },
        children: [h('span', {}, 'hud.recovery_code_label')],
      }),
      h('code', {
        style: {
          fontSize: '1.5rem',
          letterSpacing: '0.5em',
          backgroundColor: 'transparent',
          color: '#1e293b',
          padding: '8px 16px',
          borderRadius: '4px',
          display: 'inline-block',
          margin: '16px 0',
        },
        children: [h('span', {}, recoveryCode)],
      }),
      h('button', {
        style: {
          margin: '16px auto 0 auto',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '8px 16px',
          fontSize: '0.875rem',
          cursor: 'pointer',
          minWidth: '200px',
        },
        'aria-label': 'hud.copy_code',
        children: [h('span', {}, 'hud.copy_code_button')],
      }),
    ],
  });
};

/** Point d'entrée rendu : monte l'écran de code de récupération dans le DOM */
export const renderRecoveryCode = (target: HTMLElement) => {
  const container = document.createElement('div');
  target.appendChild(container);
  render(h(RecoveryCode), container);
};