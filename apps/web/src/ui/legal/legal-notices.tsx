/**
 * Role: legal-notices — écran des mentions légales.
 * Owner: frontend
 *
 * Affiche les mentions légales obligatoires :
 * - attribution OSM (ADR 0006)
 * - charte de confidentialité
 * - conditions d'utilisation
 *
 * Tout en i18n, pas de texte en dur, pas de Math.random.
 *
 * Règles :
 * - Tout texte = clé i18n (`legal.*.<sous_champ>`)
 * - Attribution OSM fixe mais formatée via i18n
 * - ARIA : `role="document"`, `aria-label` avec clé i18n
 * - Pas de `Math.random`
 */

import { h } from 'preact';
import { render } from 'preact';

const BASE_STYLE = {
  padding: '24px',
  maxWidth: '600px',
  margin: '0 auto',
  fontFamily: 'system-ui, sans-serif',
  lineHeight: '1.6',
  color: '#1e293b',
};

const LegalHeader = (): JSX.Element => (
  h('h1', {
    style: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '16px',
      color: '#3b82f6',
      textAlign: 'center',
    },
    children: [h('span', {}, 'legal.notices_title')],
  })
);

const AttributionSection = (): JSX.Element => (
  h('div', {
    style: { marginBottom: '24px' },
    children: [
      h('h2', {
        style: {
          fontSize: '1.25rem',
          fontWeight: 'medium',
          marginBottom: '8px',
          color: '#64748b',
        },
        children: [h('span', {}, 'legal.attribution_osm')],
      }),
      h('p', {
        style: {
          margin: '0',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#94a3b8',
        },
        children: [h('span', {}, 'legal.attribution_text')],
      }),
    ],
  })
);

const PrivacySection = (): JSX.Element => (
  h('div', {
    style: {
      backgroundColor: '#f1f5f9',
      borderRadius: '6px',
      padding: '16px',
      marginTop: '24px',
    },
    children: [
      h('p', {
        style: { margin: '0', fontSize: '0.875rem', color: '#374151' },
        children: [h('span', {}, 'legal.privacy_title')],
      }),
      h('ul', {
        style: {
          margin: '8px 0 0 0',
          paddingLeft: '20px',
          fontSize: '0.875rem',
          color: '#374151',
        },
        children: [
          h('li', {}, h('span', {}, 'legal.privacy_item_1')),
          h('li', {}, h('span', {}, 'legal.privacy_item_2')),
          h('li', {}, h('span', {}, 'legal.privacy_item_3')),
        ],
      }),
    ],
  })
);

const CloseButton = (): JSX.Element => (
  h('button', {
    style: {
      marginTop: '8px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '8px 16px',
      fontSize: '0.875rem',
      cursor: 'pointer',
    },
    'aria-label': 'legal.close_button',
    children: [h('span', {}, 'legal.close')],
  })
);

/** Composant écran de mentions légales */
const LegalNotices = (): JSX.Element => {
  return h('div', {
    'aria-role': 'document',
    'aria-label': 'legal.notices',
    style: BASE_STYLE,
    children: [
      h(LegalHeader),
      h(AttributionSection),
      h(PrivacySection),
      h('div', {
        style: { marginTop: '32px', textAlign: 'center' },
        children: [h(CloseButton)],
      }),
    ],
  });
};

/** Point d'entrée rendu : monte l'écran de mentions légales dans le DOM */
export const renderLegalNotices = (target: HTMLElement) => {
  const container = document.createElement('div');
  target.appendChild(container);
  render(h(LegalNotices), container);
};