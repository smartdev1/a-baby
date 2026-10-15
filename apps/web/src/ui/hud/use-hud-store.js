/**
 * Role: use-hud-store — store en signaux Prêtact pour l'état HUD.
 * Owner: frontend
 *
 * Centralise l'état du HUD : besoins, solde Djai, horloge, invites,
 * progression action, notifications, chat. Tout est en signaux réactifs
 * afin que les composants HUD s'actualisent automatiquement quand l'état
 * change (via WebSocket messages : wallet_update, needs_update, world_clock,
 * interaction_prompt).
 *
 * Important :
 * - Pas de `localStorage` ni de `sessionStorage` : l'état HUD est **volatile**,
 *   il vit tant que la session de jeu dure. La persistance (RGPD, export,
 *   suppression) se fait côté serveur (`/me/export`, `DELETE /me`).
 * - Toutes les mutations passent par les WebSocket messages du serveur ;
 *   jamais de `setState` direct hors des handlers WS.
 * - Les signaux sont `export`és par défaut pour être importés dans `main.ts`
 *   ou tout composant qui a besoin de l'état HUD.
 */
import { signal, computed } from '@preact/signals';
// === État des 5 besoins (0-100) ===
// Valeurs initiales : aucune pénalité au démarrage
const hungerSignal = signal(100); // famine
const energySignal = signal(100); // énergie
const hygieneSignal = signal(100); // hygiène
const socialSignal = signal(100); // social
const entertainmentSignal = signal(100); // divertissement
// === Solde Djai (bigint, lecture seule côté client) ===
const djaiBalanceSignal = signal(0n);
// === Horique jeu (segment d'horloge) ===
// gameMinute : minute de jeu absolue
const gameMinuteSignal = signal(0);
// realEpochMs / gameEpochMin pour affichage "jour/nuit"
const serverTimeSignal = signal(0);
// ratio 1 jour = 2h réelles = facteur 12
const clockRatioSignal = signal(12);
// === Invite d'interaction (grisée + raison) ===
// null = pas d'invite active
const interactionPromptSignal = signal(null);
// durée en ms avant de disparaître si jamais
const interactionPromptTimerSignal = signal(null);
// === Proaction action en cours (barre progression) ===
const actionProgressSignal = signal(0); // 0-100 %
const actionProgressTimerSignal = signal(null); // ms restants
// === Notifications (bannière transposable) ===
// chaque note : { key: string, duration: number }
const notificationsSignal = signal([]);
// === Chat proximité ===
const chatMessageSignal = signal(null);
// timestamp du dernier message pour limiter 1 msg/s
const lastChatMessageTimeSignal = signal(0);
/** Sélecteur computed : renvoie un objet "style" commun à tous les besoins */
export const needStyles = computed(() => ({
    base: 'rounded-lg h-64 w-64 flex flex-col items-center justify-center gap-2',
    label: 'text-center text-xs font-medium',
    percentage: 'text-4xl font-bold',
}));
/** Exporte tous les signaux + types par défaut */
export { hungerSignal, energySignal, hygieneSignal, socialSignal, entertainmentSignal, djaiBalanceSignal, gameMinuteSignal, serverTimeSignal, clockRatioSignal, interactionPromptSignal, interactionPromptTimerSignal, actionProgressSignal, actionProgressTimerSignal, notificationsSignal, chatMessageSignal, lastChatMessageTimeSignal,
// needStyles,
 };
