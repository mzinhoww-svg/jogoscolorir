// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { parseRoute, routeHash } from '@/ui/router';
import { App } from '@/App';

describe('parseRoute', () => {
  it('maps the known hashes', () => {
    expect(parseRoute('')).toEqual({ name: 'home' });
    expect(parseRoute('#/')).toEqual({ name: 'home' });
    expect(parseRoute('#/temas')).toEqual({ name: 'themes' });
    expect(parseRoute('#/tema/ocean')).toEqual({ name: 'theme', themeId: 'ocean' });
    expect(parseRoute('#/pintar/space-01')).toEqual({ name: 'paint', pageId: 'space-01' });
    expect(parseRoute('#/galeria')).toEqual({ name: 'gallery' });
    expect(parseRoute('#/pais')).toEqual({ name: 'parents' });
  });
  it('sends unknown routes and ids home', () => {
    expect(parseRoute('#/nope')).toEqual({ name: 'home' });
    expect(parseRoute('#/tema/unicorns')).toEqual({ name: 'home' });
    expect(parseRoute('#/pintar/space-99')).toEqual({ name: 'home' });
    expect(parseRoute('#/temas/extra')).toEqual({ name: 'home' });
  });
  it('round-trips', () => {
    for (const h of ['#/', '#/temas', '#/tema/robots', '#/pintar/space-03', '#/galeria', '#/pais'])
      expect(routeHash(parseRoute(h))).toBe(h);
  });
});

describe('<App> routing', () => {
  afterEach(() => cleanup());
  it('renders Home for an unknown route and follows hash changes', async () => {
    location.hash = '#/does-not-exist';
    render(<App />);
    expect(screen.getByTestId('play')).toBeTruthy();
    await act(async () => {
      location.hash = '#/pais';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(screen.getByTestId('gate-submit')).toBeTruthy();
    expect(screen.queryByTestId('toggle-music')).toBeNull();
  });
});
