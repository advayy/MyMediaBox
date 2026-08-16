import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { AppSettings, StorageMode } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { applySkin, pickCustomSkinCss } from '../lib/theme';

type Props = {
  settings: AppSettings;
  mode: StorageMode;
  backupNames: string[];
  dataMessage: string | null;
  onSave: (settings: AppSettings) => Promise<void>;
  onClearLibrary: () => Promise<void>;
  onBackupNow: () => Promise<void>;
  onExport: () => Promise<void>;
  onImport: () => Promise<void>;
};

type SettingsTab = 'appearance' | 'tracking' | 'metadata' | 'data';
type PreviewPage = 'discover' | 'movies' | 'shows' | 'upcoming' | 'history' | 'stats';

const PREVIEW_PAGES: Array<{ key: PreviewPage; label: string }> = [
  { key: 'discover', label: 'Discover' },
  { key: 'movies', label: 'Movies' },
  { key: 'shows', label: 'Shows' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'history', label: 'History' },
  { key: 'stats', label: 'Stats' },
];

function ColorField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="appearance-color-field">
      <span><strong>{label}</strong><small>{description}</small></span>
      <span className="color-input-pair">
        <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'} onChange={(event) => onChange(event.target.value)} />
        <input
          className="color-hex-input"
          value={value}
          maxLength={7}
          onChange={(event) => {
            const next = event.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(next)) onChange(next);
          }}
        />
      </span>
    </label>
  );
}

export function SettingsView({ settings, mode, backupNames, dataMessage, onSave, onClearLibrary, onBackupNow, onExport, onImport }: Props) {
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<SettingsTab>('appearance');
  const [previewPage, setPreviewPage] = useState<PreviewPage>('discover');

  useEffect(() => setDraft(settings), [settings]);

  useEffect(() => {
    applySkin(draft);
    return () => applySkin(settings);
  }, [
    draft.skin,
    draft.retroAccent,
    draft.retroDesktop,
    draft.retroSurface,
    draft.completionColor,
    draft.incompleteColor,
    draft.discoverTabColor,
    draft.moviesTabColor,
    draft.showsTabColor,
    draft.upcomingTabColor,
    draft.historyTabColor,
    draft.statsTabColor,
    draft.upToDateTagColor,
    draft.completedTagColor,
    draft.didNotFinishTagColor,
    draft.ratingColor,
    draft.favoriteColor,
    draft.customSkinEnabled,
    draft.customSkinCss,
    settings,
  ]);

  const appearanceChanged = useMemo(
    () =>
      draft.skin !== settings.skin ||
      draft.pixelNavIcons !== settings.pixelNavIcons ||
      draft.retroAccent !== settings.retroAccent ||
      draft.retroDesktop !== settings.retroDesktop ||
      draft.retroSurface !== settings.retroSurface ||
      draft.completionColor !== settings.completionColor ||
      draft.incompleteColor !== settings.incompleteColor ||
      draft.discoverTabColor !== settings.discoverTabColor ||
      draft.moviesTabColor !== settings.moviesTabColor ||
      draft.showsTabColor !== settings.showsTabColor ||
      draft.upcomingTabColor !== settings.upcomingTabColor ||
      draft.historyTabColor !== settings.historyTabColor ||
      draft.statsTabColor !== settings.statsTabColor ||
      draft.upToDateTagColor !== settings.upToDateTagColor ||
      draft.completedTagColor !== settings.completedTagColor ||
      draft.didNotFinishTagColor !== settings.didNotFinishTagColor ||
      draft.ratingColor !== settings.ratingColor ||
      draft.favoriteColor !== settings.favoriteColor ||
      draft.customSkinEnabled !== settings.customSkinEnabled ||
      draft.customSkinCss !== settings.customSkinCss,
    [draft, settings],
  );

  async function save() {
    await onSave(draft);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  }

  function resetRetroPalette() {
    setDraft({
      ...draft,
      retroAccent: DEFAULT_SETTINGS.retroAccent,
      retroDesktop: DEFAULT_SETTINGS.retroDesktop,
      retroSurface: DEFAULT_SETTINGS.retroSurface,
      completionColor: DEFAULT_SETTINGS.completionColor,
      incompleteColor: DEFAULT_SETTINGS.incompleteColor,
      discoverTabColor: DEFAULT_SETTINGS.discoverTabColor,
      moviesTabColor: DEFAULT_SETTINGS.moviesTabColor,
      showsTabColor: DEFAULT_SETTINGS.showsTabColor,
      upcomingTabColor: DEFAULT_SETTINGS.upcomingTabColor,
      historyTabColor: DEFAULT_SETTINGS.historyTabColor,
      statsTabColor: DEFAULT_SETTINGS.statsTabColor,
      upToDateTagColor: DEFAULT_SETTINGS.upToDateTagColor,
      completedTagColor: DEFAULT_SETTINGS.completedTagColor,
      didNotFinishTagColor: DEFAULT_SETTINGS.didNotFinishTagColor,
      ratingColor: DEFAULT_SETTINGS.ratingColor,
      favoriteColor: DEFAULT_SETTINGS.favoriteColor,
    });
  }

  return (
    <main className="page settings-page">
      <div className="page-heading-row compact-heading">
        <div><p className="eyebrow">App preferences and local data</p><h1>Settings</h1></div>
      </div>

      <nav className="settings-tabs" aria-label="Settings sections">
        <button className={tab === 'appearance' ? 'active' : ''} onClick={() => setTab('appearance')}>Appearance</button>
        <button className={tab === 'tracking' ? 'active' : ''} onClick={() => setTab('tracking')}>Tracking</button>
        <button className={tab === 'metadata' ? 'active' : ''} onClick={() => setTab('metadata')}>Metadata</button>
        <button className={tab === 'data' ? 'active' : ''} onClick={() => setTab('data')}>Data & app</button>
      </nav>

      {tab === 'appearance' && (
        <section className="settings-card skin-settings-card appearance-editor">
          <div className="settings-section-heading">
            <div><p className="eyebrow">Live preview</p><h2>Appearance</h2></div>
            {appearanceChanged && <span className="unsaved-tag">Previewing unsaved changes</span>}
          </div>

          <label className="setting-row">
            <span><strong>Base skin</strong><small>Retro 98 uses 98.css controls. Modern uses a quieter grey shell with the same configurable section colors.</small></span>
            <select value={draft.skin} onChange={(e) => setDraft({ ...draft, skin: e.target.value === 'modern' ? 'modern' : 'retro98' })}>
              <option value="retro98">Retro 98</option>
              <option value="modern">Modern</option>
            </select>
          </label>

          <label className="setting-row">
            <span><strong>Pixel navigation icons</strong><small>Use the bundled pixel-art toolbar set. Off uses the original vector fallback icons.</small></span>
            <input type="checkbox" checked={draft.pixelNavIcons} onChange={(e) => setDraft({ ...draft, pixelNavIcons: e.target.checked })} />
          </label>

          <div className="appearance-group">
            <div className="appearance-group-heading"><h3>Chrome & progress</h3><small>Base greys and the watched-progress treatment.</small></div>
            <div className="appearance-grid">
              <ColorField label="Settings / fallback" description="Settings and generic areas without their own section color." value={draft.retroAccent} onChange={(retroAccent) => setDraft({ ...draft, retroAccent })} />
              <ColorField label="Desktop grey" description="Main Retro 98 catalogue background." value={draft.retroDesktop} onChange={(retroDesktop) => setDraft({ ...draft, retroDesktop })} />
              <ColorField label="Window surface" description="Panels, title blocks and controls." value={draft.retroSurface} onChange={(retroSurface) => setDraft({ ...draft, retroSurface })} />
              <ColorField label="Watched / progress" description="Caught-up circles and completed progress fill." value={draft.completionColor} onChange={(completionColor) => setDraft({ ...draft, completionColor })} />
              <ColorField label="Remaining progress" description="Uncompleted part of progress bars." value={draft.incompleteColor} onChange={(incompleteColor) => setDraft({ ...draft, incompleteColor })} />
            </div>
          </div>

          <div className="appearance-group">
            <div className="appearance-group-heading"><h3>Navigation tabs</h3><small>Each main area can carry its own accent.</small></div>
            <div className="appearance-grid appearance-grid-three">
              <ColorField label="Discover" description="Default discovery / browse accent." value={draft.discoverTabColor} onChange={(discoverTabColor) => setDraft({ ...draft, discoverTabColor })} />
              <ColorField label="My Movies" description="Movie library accent." value={draft.moviesTabColor} onChange={(moviesTabColor) => setDraft({ ...draft, moviesTabColor })} />
              <ColorField label="My Shows" description="TV library accent." value={draft.showsTabColor} onChange={(showsTabColor) => setDraft({ ...draft, showsTabColor })} />
              <ColorField label="Upcoming" description="Upcoming releases accent." value={draft.upcomingTabColor} onChange={(upcomingTabColor) => setDraft({ ...draft, upcomingTabColor })} />
              <ColorField label="Watch History" description="History accent." value={draft.historyTabColor} onChange={(historyTabColor) => setDraft({ ...draft, historyTabColor })} />
              <ColorField label="Your Stats" description="Statistics accent." value={draft.statsTabColor} onChange={(statsTabColor) => setDraft({ ...draft, statsTabColor })} />
            </div>
          </div>

          <div className="appearance-group">
            <div className="appearance-group-heading"><h3>Status & actions</h3><small>Useful when building a skin with stronger category colors.</small></div>
            <div className="appearance-grid appearance-grid-three">
              <ColorField label="Up to date tag" description="Caught-up status tag in Watch History." value={draft.upToDateTagColor} onChange={(upToDateTagColor) => setDraft({ ...draft, upToDateTagColor })} />
              <ColorField label="Completed tag" description="Completed/ended-show status tag." value={draft.completedTagColor} onChange={(completedTagColor) => setDraft({ ...draft, completedTagColor })} />
              <ColorField label="Did not finish" description="Stopped-watching / DNF tag." value={draft.didNotFinishTagColor} onChange={(didNotFinishTagColor) => setDraft({ ...draft, didNotFinishTagColor })} />
              <ColorField label="Rating star" description="Rating buttons and rating emphasis." value={draft.ratingColor} onChange={(ratingColor) => setDraft({ ...draft, ratingColor })} />
              <ColorField label="Favorite" description="Favorited-heart emphasis." value={draft.favoriteColor} onChange={(favoriteColor) => setDraft({ ...draft, favoriteColor })} />
            </div>
          </div>

          <div
            className="appearance-preview skin-preview"
            data-preview-skin={draft.skin}
            data-preview-page={previewPage}
            style={{
              '--preview-page-accent': previewPage === 'movies' ? draft.moviesTabColor
                : previewPage === 'shows' ? draft.showsTabColor
                  : previewPage === 'upcoming' ? draft.upcomingTabColor
                    : previewPage === 'history' ? draft.historyTabColor
                      : previewPage === 'stats' ? draft.statsTabColor
                        : draft.discoverTabColor,
            } as CSSProperties}
            aria-label="Live appearance preview"
          >
            <div className="appearance-preview-title">{draft.skin === 'retro98' ? 'Retro 98' : 'Modern'} · live page preview</div>
            <div className="appearance-preview-tabs" aria-label="Preview section">
              {PREVIEW_PAGES.map((page) => {
                const color = page.key === 'movies' ? draft.moviesTabColor
                  : page.key === 'shows' ? draft.showsTabColor
                    : page.key === 'upcoming' ? draft.upcomingTabColor
                      : page.key === 'history' ? draft.historyTabColor
                        : page.key === 'stats' ? draft.statsTabColor
                          : draft.discoverTabColor;
                return (
                  <button
                    key={page.key}
                    className={previewPage === page.key ? 'active' : ''}
                    style={{ '--preview-tab-accent': color } as CSSProperties}
                    onClick={() => setPreviewPage(page.key)}
                  >
                    {page.label}
                  </button>
                );
              })}
            </div>
            <div className="appearance-preview-body">
              <div className="appearance-preview-heading">
                <small>LOCAL LIBRARY</small>
                <strong>{PREVIEW_PAGES.find((page) => page.key === previewPage)?.label}</strong>
              </div>
              <div className="appearance-preview-controls">
                <button className="appearance-preview-button active">Selected control</button>
                <button className="appearance-preview-button">Sort & filter</button>
              </div>
              <div className="appearance-preview-info"><strong>Media information</strong><span>The preview uses the selected base skin plus the current page color.</span></div>
              <div className="appearance-preview-statuses">
                <span style={{ background: draft.upToDateTagColor }}>Up to date</span>
                <span style={{ background: draft.completedTagColor }}>Completed</span>
                <span style={{ background: draft.didNotFinishTagColor }}>Did not finish</span>
                <span style={{ color: draft.ratingColor }}>★ 8.5</span>
                <span style={{ color: draft.favoriteColor }}>♥</span>
              </div>
              <div className="appearance-preview-progress"><span style={{ width: '67%' }} /></div>
            </div>
          </div>

          <div className="data-actions skin-actions">
            <button className="secondary-action" onClick={resetRetroPalette}>Reset palette</button>
            <button className="secondary-action" onClick={() => void pickCustomSkinCss().then((css) => {
              if (css !== null) setDraft({ ...draft, customSkinCss: css, customSkinEnabled: true });
            })}>Import custom .css…</button>
            {draft.customSkinCss.trim() && <button className="secondary-action" onClick={() => setDraft({ ...draft, customSkinCss: '', customSkinEnabled: false })}>Remove custom skin</button>}
          </div>

          <label className="setting-row">
            <span><strong>Custom CSS overlay</strong><small>A local CSS file can override the selected base skin. This is intended for shareable community skins.</small></span>
            <input type="checkbox" checked={draft.customSkinEnabled} disabled={!draft.customSkinCss.trim()} onChange={(e) => setDraft({ ...draft, customSkinEnabled: e.target.checked })} />
          </label>
          <small className="note">Changes above preview immediately. Use Save settings to keep them after leaving this page.</small>
        </section>
      )}

      {tab === 'tracking' && (
        <section className="settings-card">
          <h2>Tracking</h2>
          <label className="setting-row"><span><strong>Haven't watched threshold</strong><small>Move a started show into the stale section after this many days.</small></span><input type="number" min="1" max="365" value={draft.staleDays} onChange={(e) => setDraft({ ...draft, staleDays: Number(e.target.value) })} /></label>
          <label className="setting-row"><span><strong>Include specials in progress</strong><small>Off by default. Specials still remain visible in the show page.</small></span><input type="checkbox" checked={draft.includeSpecialsInProgress} onChange={(e) => setDraft({ ...draft, includeSpecialsInProgress: e.target.checked })} /></label>
          <label className="setting-row"><span><strong>Ask for a rating after finishing something</strong><small>Off by default. When enabled, finishing a movie or catching up on a show opens the 0–10 rating control.</small></span><input type="checkbox" checked={draft.promptForRatingAfterWatch} onChange={(e) => setDraft({ ...draft, promptForRatingAfterWatch: e.target.checked })} /></label>
        </section>
      )}

      {tab === 'metadata' && (
        <section className="settings-card">
          <h2>TMDB metadata</h2>
          <label className="stacked-setting"><span><strong>Read Access Token</strong><small>The token is stored locally and is excluded from portable JSON exports.</small></span><input type="password" value={draft.tmdbToken} onChange={(e) => setDraft({ ...draft, tmdbToken: e.target.value.trim() })} placeholder="eyJhbGciOiJIUzI1NiJ9…" /></label>
          <label className="setting-row"><span><strong>Safe search</strong><small>On by default. Excludes titles TMDB marks as adult from Search, Discover, and recommendations.</small></span><input type="checkbox" checked={draft.safeSearch} onChange={(e) => setDraft({ ...draft, safeSearch: e.target.checked })} /></label>
          <div className="two-col-settings"><label><span>Language</span><input value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value })} /></label><label><span>Region</span><input value={draft.region} onChange={(e) => setDraft({ ...draft, region: e.target.value.toUpperCase() })} maxLength={2} /></label></div>
          <small className="note">Region controls provider availability and regional certifications where TMDB has them.</small>
        </section>
      )}

      {tab === 'data' && (
        <>
          <section className="settings-card data-card">
            <h2>Data safety</h2>
            <div className="data-status"><span>Storage engine</span><strong>{mode === 'sqlite' ? 'SQLite · native desktop' : 'localStorage · browser demo'}</strong></div>
            {mode === 'sqlite' && <><div className="data-status"><span>Persistent data</span><strong>Application Support / dev.localtv.tracker</strong></div><div className="data-status"><span>Automatic backups</span><strong>{backupNames.length ? `${backupNames.length} retained · newest ${backupNames[0]}` : 'Created daily on launch · up to 10 retained'}</strong></div></>}
            <div className="data-actions"><button className="secondary-action" onClick={() => void onBackupNow()}>Back up now</button><button className="secondary-action" onClick={() => void onExport()}>Export JSON…</button><button className="secondary-action" onClick={() => { if (window.confirm('Restore a backup? The app will create a safety backup first, then replace local catalogue/history data. Your TMDB token will be kept.')) void onImport(); }}>Restore JSON…</button></div>
            {dataMessage && <div className="data-message">{dataMessage}</div>}
            <small className="note">Backups include your library, watched state, favorites, ratings, DNF state and appearance settings. API tokens are excluded.</small>
          </section>
          <section className="settings-card"><h2>Updates & uninstalling</h2><p className="credit-copy">User data lives outside the app bundle. Rebuilding, replacing, or upgrading the app does not normally remove watch history while the storage identifier remains <code>dev.localtv.tracker</code>.</p><small className="note">To completely uninstall on macOS, remove the app and delete <code>~/Library/Application Support/dev.localtv.tracker/</code>. That second step permanently removes the local database and backups.</small></section>
          <section className="settings-card"><h2>About / Credits</h2><p className="credit-copy">This product uses the TMDB API but is not endorsed or certified by TMDB.</p><p className="credit-copy">Streaming availability data is supplied by JustWatch through TMDB.</p></section>
          <section className="settings-card"><h2>Library maintenance</h2><button className="danger-button" onClick={() => { if (window.confirm('Remove every title from the library? Watched history will remain so re-adding a title can restore its progress.')) void onClearLibrary(); }}>Clear library only</button><small className="note">Watched history and ratings are preserved when the library is cleared or a title is removed.</small></section>
        </>
      )}

      <div className="settings-save-row"><button className="save-button" onClick={() => void save()}>{saved ? 'Saved ✓' : 'Save settings'}</button></div>
    </main>
  );
}
