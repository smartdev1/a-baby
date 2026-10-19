/**
 * Role: HUD setup helper — initializes Djai and clock displays with resize handling.
 * Owner: frontend
 */
import { renderDjaiDisplay } from '../../ui/hud/djai-display.tsx';
import { renderClockDisplay } from '../../ui/hud/clock-display.tsx';

export function createHUD(): { onResize(): void } {
  const hudTarget = document.getElementById('ui-root');
  if (!hudTarget) {
    throw new Error('#ui-root not found');
  }
  const djaiDisplay: HTMLElement = renderDjaiDisplay(hudTarget);
  const clockDisplay: HTMLElement = renderClockDisplay(hudTarget);

  return {
    onResize() {
      if (djaiDisplay.parentElement) {
        djaiDisplay.parentElement.removeChild(djaiDisplay);
        renderDjaiDisplay(djaiDisplay.parentElement);
      }
      if (clockDisplay.parentElement) {
        clockDisplay.parentElement.removeChild(clockDisplay);
        renderClockDisplay(clockDisplay.parentElement);
      }
    }
  };
}
