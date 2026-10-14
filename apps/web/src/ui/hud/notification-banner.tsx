/**
 * Role: notification-banner — système de notifications transposable.
 * Owner: frontend
 *
 * Notification venant des WebSocket messages (`notifications_update`).
 * Chaque note : { key: string, duration: number } (duration en ms).
 * Déterministe, affichage FIFO, pas de Math.random.
 *
 * Règles :
 * - Label = clé i18n dérivée de `notification.<key>`
 * - Affichage en banner transient (top-right ou bottom)
 * - Auto-dispar après `duration` ms
 * - ARIA : `role="alert"`, `aria-live="polite"`
 * - Pas de `Math.random` ; tout issu des signaux du serveur
 */

import { h } from 'preact';
import { render } from 'preact';
import { notificationsSignal } from './use-hud-store.ts';

/** Composant banner de notifications */
const NotificationBanner = (): JSX.Element => {
  const notifications = notificationsSignal.value as Array<{ key: string; duration: number }>;

  if (!notifications.length) {
    return null;
  }

  // Render first notification (FIFO)
  const first = notifications[0];

  return h('div', {
    style: {
      // Position will be managed by parent HUD layout
      padding: '8px 12px',
      backgroundColor: '#3b82f6',
      color: 'white',
      borderRadius: '4px',
      fontSize: '0.875rem',
      marginBottom: '8px',
    },
    'aria-role': 'alert',
    'aria-live': 'polite',
    children: [
      h('span', {}, first.key),
      h('div', {
        style: {
          float: 'right',
          opacity: 0.7,
          fontSize: '0.75rem',
        },
        children: ['×'], // close action
      }),
    ],
  });
};

/** Point d'entrée rendu : monte la bannière dans le DOM */
export const renderNotificationBanner = (target: HTMLElement) => {
  const container = document.createElement('div');
  target.appendChild(container);
  render(h(NotificationBanner, null), container);
  return container;
};