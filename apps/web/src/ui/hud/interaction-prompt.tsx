/**
 * Role: interaction-prompt — invite d'interaction grisée + raison.
 * Owner: frontend
 *
 * Affichage quand une action nécessite interaction (ex. porte fermée, commerce fermé).
 * Raison extraite de l'event WebSocket `interaction_prompt`.
 * Déterministe, pas de Math.random.
 *
 * Règles :
 * - Label = clé i18n (`hud.interaction_prompt`)
 * - Raison grisée affichée sous le label
 * - ARIA : `role="status"`, `aria-label` avec clé i18n
 * - Masculin par défaut (français), pas de logique conditionnelle complexe
 */

import { h } from 'preact';
import { render } from 'preact';
import { interactionPromptSignal, interactionPromptTimerSignal } from './use-hud-store.ts';

/** Composant invite d'interaction */
const InteractionPrompt = (): JSX.Element => {
  const promptText = interactionPromptSignal.value;
  const timer = interactionPromptTimerSignal.value;

  if (!promptText) {
    // Nothing to display
    return h('div', {
      role: 'status',
      'aria-label': 'hud.interaction_prompt',
    });
  }

  // Compute greyed style based on timer if present
  const baseStyle = {
    fontSize: '0.875rem',
    textAlign: 'center',
    color: '#94a3b8', // muted/secondary color
    marginTop: '8px',
  };

  return h('div', {
    role: 'status',
    'aria-label': 'hud.interaction_prompt',
    style: {
      ...baseStyle,
      // If timer is set, we could add fade-out logic later
    },
    children: [
      h('span', {}, promptText),
      // Raison grisée (ex. "Fermé — 06:00")
      timer &&
        timer > 0 &&
        h('div', {
          style: {
            fontSize: '0.75rem',
            marginTop: '4px',
            color: '#64748b',
          },
          children: [h('span', { 'aria-hidden': 'true' }, 'hud.interaction_prompt_reason')],
        }),
    ],
  });
};

/** Point d'entrée rendu : monte l'invite d'interaction dans le DOM */
export const renderInteractionPrompt = (target: HTMLElement) => {
  const container = document.createElement('div');
  target.appendChild(container);
  render(h(InteractionPrompt, null), container);
  return container;
};