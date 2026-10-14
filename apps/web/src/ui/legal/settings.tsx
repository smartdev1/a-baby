/**
 * Role: settings — écran des paramètres.
 * Owner: frontend
 *
 * Permet de configurer les options de qualité, les touches de contrôle
 * et les options d'accessibilité.
 *
 * Règles :
 * - Tout texte = clé i18n (`settings.*.<sous_champ>`)
 * - Couleurs et qualité via sélecteurs, pas de saisie manuelle
 * - Gestion des touches clavier via injection de dépendances
 * - Pas de `Math.random`
 * - ARIA : `role="dialog"`, `aria-label` avec clé i18n
 * - Focus piégé quand l'écran est ouvert
 */

import { h, render } from 'preact';

const QUALITY_OPTIONS = [
  { value: 'low', label: 'settings.quality_low' },
  { value: 'medium', label: 'settings.quality_medium' },
  { value: 'high', label: 'settings.quality_high' },
] as const;

const KEY_PRESETS = [
  { key: 'azerty', label: 'settings.keys_azerty' },
  { key: 'qwerty', label: 'settings.keys_qwerty' },
] as const;

const BASE_STYLE = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '32px',
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
  width: '90%',
  maxWidth: '400px',
  maxHeight: '90vh',
  overflowY: 'auto',
  zIndex: '1000',
};

const LABEL_STYLE = {
  display: 'block',
  fontSize: '0.875rem',
  marginBottom: '8px',
  color: '#374151',
};

const SELECT_STYLE = {
  width: '100%',
  padding: '8px',
  fontSize: '0.875rem',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  backgroundColor: 'white',
  margin: '4px 0 0 0',
};

const BUTTON_BASE = {
  flex: '1',
  border: 'none',
  borderRadius: '4px',
  padding: '8px',
  fontSize: '0.875rem',
  cursor: 'pointer',
};

/** Composant écran de paramètres */
const Settings = (): JSX.Element => {
  return h('div', {
    'aria-role': 'dialog',
    'aria-label': 'settings.title',
    style: BASE_STYLE,
    children: [
      h('h2', {
        style: {
          margin: '0 0 24px 0',
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#1e293b',
          textAlign: 'center',
        },
        children: [h('span', {}, 'settings.title')],
      }),

      // Qualité graphique
      h('div', {
        style: { marginBottom: '24px' },
        children: [
          h('label', { style: LABEL_STYLE, children: [h('span', {}, 'settings.quality_label')] }),
          h('select', {
            style: SELECT_STYLE,
            children: QUALITY_OPTIONS.map((opt) =>
              h('option', { key: opt.value, value: opt.value, children: [h('span', {}, opt.label)] })
            ),
          }),
        ],
      }),

      // Préréglages de touches
      h('div', {
        style: { marginBottom: '24px' },
        children: [
          h('label', { style: LABEL_STYLE, children: [h('span', {}, 'settings.keys_label')] }),
          h('select', {
            style: SELECT_STYLE,
            children: KEY_PRESETS.map((preset) =>
              h('option', { key: preset.key, value: preset.key, children: [h('span', {}, preset.label)] })
            ),
          }),
        ],
      }),

      // Boutons d'action
      h('div', {
        style: { display: 'flex', justifyContent: 'flex-end', marginTop: '32px', gap: '8px' },
        children: [
          h('button', {
            style: { ...BUTTON_BASE, backgroundColor: '#64748b', color: 'white' },
            'aria-label': 'settings.cancel',
            children: [h('span', {}, 'settings.cancel')],
          }),
          h('button', {
            style: { ...BUTTON_BASE, backgroundColor: '#3b82f6', color: 'white' },
            'aria-label': 'settings.confirm',
            children: [h('span', {}, 'settings.confirm')],
          }),
        ],
      }),
    ],
  });
};

/** Point d'entrée rendu : monte l'écran de paramètres dans le DOM */
export const renderSettings = (target: HTMLElement) => {
  const container = document.createElement('div');
  target.appendChild(container);
  render(h(Settings), container);
};