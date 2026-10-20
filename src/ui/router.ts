import { useEffect, useState } from 'react';
import { getPage, THEMES } from '@/catalog';

export type Route =
  | { name: 'home' }
  | { name: 'themes' }
  | { name: 'theme'; themeId: string }
  | { name: 'paint'; pageId: string }
  | { name: 'gallery' }
  | { name: 'parents' };

/** Parse a location hash; anything unknown (or an unknown theme/page id) is home. */
export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '').replace(/\/+$/, '') || '/';
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  const [a = '', b = ''] = parts;
  if (parts.length === 1 && a === 'temas') return { name: 'themes' };
  if (parts.length === 1 && a === 'galeria') return { name: 'gallery' };
  if (parts.length === 1 && a === 'pais') return { name: 'parents' };
  if (parts.length === 2 && a === 'tema' && THEMES.some((t) => t.id === b))
    return { name: 'theme', themeId: b };
  if (parts.length === 2 && a === 'pintar' && getPage(b)) return { name: 'paint', pageId: b };
  return { name: 'home' };
}

export function routeHash(r: Route): string {
  switch (r.name) {
    case 'home':
      return '#/';
    case 'themes':
      return '#/temas';
    case 'theme':
      return `#/tema/${r.themeId}`;
    case 'paint':
      return `#/pintar/${r.pageId}`;
    case 'gallery':
      return '#/galeria';
    case 'parents':
      return '#/pais';
  }
}

export function navigate(hash: string): void {
  if (location.hash !== hash) location.hash = hash;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(location.hash));
  useEffect(() => {
    const on = () => setRoute(parseRoute(location.hash));
    window.addEventListener('hashchange', on);
    on();
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
