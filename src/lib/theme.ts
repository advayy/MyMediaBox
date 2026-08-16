import retro98Css from '98.css/dist/98.css?raw';
import type { AppSettings } from '../types';

const RETRO_STYLE_ID = 'imtt-retro98-base';
const CUSTOM_STYLE_ID = 'imtt-custom-skin';

function setStyle(id: string, css: string | null) {
  const existing = document.getElementById(id) as HTMLStyleElement | null;
  if (!css) {
    existing?.remove();
    return;
  }
  const style = existing ?? document.createElement('style');
  style.id = id;
  style.textContent = css;
  if (!existing) document.head.appendChild(style);
}

export function applySkin(settings: Pick<AppSettings,
  'skin' |
  'retroAccent' |
  'retroDesktop' |
  'retroSurface' |
  'completionColor' |
  'incompleteColor' |
  'discoverTabColor' |
  'moviesTabColor' |
  'showsTabColor' |
  'upcomingTabColor' |
  'historyTabColor' |
  'statsTabColor' |
  'upToDateTagColor' |
  'completedTagColor' |
  'didNotFinishTagColor' |
  'ratingColor' |
  'favoriteColor' |
  'customSkinEnabled' |
  'customSkinCss'
>) {
  const root = document.documentElement;
  root.dataset.skin = settings.skin;
  root.style.setProperty('--imtt-retro-accent', settings.retroAccent);
  root.style.setProperty('--imtt-retro-desktop', settings.retroDesktop);
  root.style.setProperty('--imtt-retro-surface', settings.retroSurface);
  root.style.setProperty('--imtt-completion', settings.completionColor);
  root.style.setProperty('--imtt-incomplete', settings.incompleteColor);
  root.style.setProperty('--imtt-nav-discover', settings.discoverTabColor);
  root.style.setProperty('--imtt-nav-movies', settings.moviesTabColor);
  root.style.setProperty('--imtt-nav-shows', settings.showsTabColor);
  root.style.setProperty('--imtt-nav-upcoming', settings.upcomingTabColor);
  root.style.setProperty('--imtt-nav-history', settings.historyTabColor);
  root.style.setProperty('--imtt-nav-stats', settings.statsTabColor);
  root.style.setProperty('--imtt-tag-up-to-date', settings.upToDateTagColor);
  root.style.setProperty('--imtt-tag-completed', settings.completedTagColor);
  root.style.setProperty('--imtt-tag-dnf', settings.didNotFinishTagColor);
  root.style.setProperty('--imtt-rating', settings.ratingColor);
  root.style.setProperty('--imtt-favorite', settings.favoriteColor);
  setStyle(RETRO_STYLE_ID, settings.skin === 'retro98' ? retro98Css : null);
  setStyle(CUSTOM_STYLE_ID, settings.customSkinEnabled && settings.customSkinCss.trim() ? settings.customSkinCss : null);
}

function browserPickCss(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'text/css,.css';
    input.onchange = async () => {
      const file = input.files?.[0];
      resolve(file ? await file.text() : null);
    };
    input.click();
  });
}

export async function pickCustomSkinCss(): Promise<string | null> {
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  if (!isTauri) return browserPickCss();
  const { open } = await import('@tauri-apps/plugin-dialog');
  const { readTextFile } = await import('@tauri-apps/plugin-fs');
  const path = await open({ multiple: false, directory: false, filters: [{ name: 'CSS skin', extensions: ['css'] }] });
  if (!path || Array.isArray(path)) return null;
  return readTextFile(path);
}
