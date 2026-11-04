import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TimezoneOverlap } from './TimezoneOverlap';
import { isValidZone } from './overlap';
import { resolveLang } from './messages';
import { detectZone } from './zones';
import css from './styles.css?inline';

export const TAG_NAME = 'timezone-overlap-map';

const ATTRIBUTES = ['home-zone', 'home-label', 'visitor-zone', 'work-start', 'work-end', 'lang'] as const;

export type ZoneChangeEvent = CustomEvent<{ zone: string }>;

// Importing on the server (SSR) must not throw: there is no HTMLElement there.
const BaseElement = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement;

// one parsed stylesheet shared by every instance
let sheet: CSSStyleSheet | undefined;
function adoptStyles(shadow: ShadowRoot) {
  if ('adoptedStyleSheets' in shadow && typeof CSSStyleSheet.prototype.replaceSync === 'function') {
    sheet ??= new CSSStyleSheet();
    if (!sheet.cssRules.length) sheet.replaceSync(css);
    shadow.adoptedStyleSheets = [sheet];
  } else {
    const style = document.createElement('style');
    style.textContent = css;
    shadow.append(style);
  }
}

function hour(value: string | null, fallback: number): number {
  const n = value === null ? NaN : Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 24 ? n : fallback;
}

/**
 * `<timezone-overlap-map home-zone="America/Argentina/Buenos_Aires">`
 *
 * Attributes: `home-zone` (IANA name), `home-label`, `visitor-zone` (defaults to the
 * browser's zone), `work-start` / `work-end` (local hours, default 9 and 18), `lang`
 * (`en` or `es`; defaults to the closest `lang` up the tree, like the page's `<html lang>`).
 * Fires `zonechange` (detail: `{ zone }`) when the visitor picks another zone.
 */
export class TimezoneOverlapMapElement extends BaseElement {
  static observedAttributes = ATTRIBUTES;

  #root: Root | undefined;
  #unmount: number | undefined;

  connectedCallback() {
    // moved within the document: disconnect + connect in the same task, keep the root
    if (this.#unmount !== undefined) {
      clearTimeout(this.#unmount);
      this.#unmount = undefined;
    }
    if (!this.#root) {
      const shadow = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
      adoptStyles(shadow);
      const container = document.createElement('div');
      shadow.append(container);
      this.#root = createRoot(container);
    }
    this.#render();
  }

  disconnectedCallback() {
    this.#unmount = window.setTimeout(() => {
      this.#root?.unmount();
      this.#root = undefined;
      this.shadowRoot?.replaceChildren();
      this.#unmount = undefined;
    });
  }

  attributeChangedCallback() {
    if (this.#root) this.#render();
  }

  #render() {
    const home = this.getAttribute('home-zone');
    const visitor = this.getAttribute('visitor-zone');
    const visitorZone = visitor && isValidZone(visitor) ? visitor : detectZone();

    this.#root?.render(
      <StrictMode>
        <TimezoneOverlap
          // a new visitor-zone attribute resets whatever the visitor picked
          key={visitorZone}
          homeZone={home && isValidZone(home) ? home : 'UTC'}
          homeLabel={this.getAttribute('home-label') ?? undefined}
          visitorZone={visitorZone}
          workStart={hour(this.getAttribute('work-start'), 9)}
          workEnd={hour(this.getAttribute('work-end'), 18)}
          lang={resolveLang(this.closest('[lang]')?.getAttribute('lang'))}
          onVisitorZoneChange={(zone) =>
            this.dispatchEvent(
              new CustomEvent('zonechange', { detail: { zone }, bubbles: true, composed: true }),
            )
          }
        />
      </StrictMode>,
    );
  }
}

/** Registers the element under `tagName`; safe to call twice and on the server. */
export function defineTimezoneOverlapMap(tagName = TAG_NAME): void {
  if (typeof customElements === 'undefined' || customElements.get(tagName)) return;
  // a subclass per tag: one constructor can only be registered once
  customElements.define(tagName, class extends TimezoneOverlapMapElement {});
}

declare global {
  interface HTMLElementTagNameMap {
    'timezone-overlap-map': TimezoneOverlapMapElement;
  }
  interface HTMLElementEventMap {
    zonechange: ZoneChangeEvent;
  }
}
