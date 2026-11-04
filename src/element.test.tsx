import { act } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import './index';

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  document.body.replaceChildren();
});

async function mount(attributes: Record<string, string>) {
  const el = document.createElement('timezone-overlap-map');
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value);
  await act(async () => document.body.append(el));
  return el;
}

const summary = (el: HTMLElement) => el.shadowRoot?.querySelector('.summary')?.textContent ?? '';

describe('<timezone-overlap-map>', () => {
  it('is registered once, even if defined again', async () => {
    const { defineTimezoneOverlapMap } = await import('./index');
    expect(() => defineTimezoneOverlapMap()).not.toThrow();
    expect(customElements.get('timezone-overlap-map')).toBeDefined();
  });

  it('renders the overlap in its shadow root', async () => {
    const el = await mount({ 'home-zone': 'UTC', 'visitor-zone': 'UTC', 'home-label': 'Santiago' });
    expect(summary(el)).toContain('9 h of overlap with Santiago');
  });

  it('re-renders when an attribute changes', async () => {
    const el = await mount({ 'home-zone': 'UTC', 'visitor-zone': 'UTC' });
    await act(async () => el.setAttribute('work-end', '12'));
    expect(summary(el)).toContain('3 h of overlap');
  });

  it('fires zonechange when the visitor picks another zone', async () => {
    const el = await mount({ 'home-zone': 'UTC', 'visitor-zone': 'UTC' });
    const listener = vi.fn();
    el.addEventListener('zonechange', listener);

    const select = el.shadowRoot!.querySelector('select')!;
    await act(async () => {
      select.value = 'Asia/Tokyo';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0]![0].detail).toEqual({ zone: 'Asia/Tokyo' });
  });

  it('falls back to UTC for an invalid home zone', async () => {
    const el = await mount({ 'home-zone': 'Not/AZone', 'visitor-zone': 'UTC' });
    expect(summary(el)).toContain('with UTC');
  });
});
