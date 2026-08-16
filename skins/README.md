# Skins

The app has two built-in skins:

- `Retro 98` — default, built on [98.css](https://jdan.github.io/98.css/) with the project's grey + light-purple palette.
- `Modern` — the visual style used by the earlier alpha builds.

The **Settings → Appearance** tab can live-preview the built-in palette (accent, desktop, surface, completed, and remaining-progress colors) before saving. A custom `.css` file can also be imported there. Custom CSS is stored locally with normal settings and is applied as an overlay on top of the selected built-in skin.

## Making a skin

Start with `custom-skin.example.css`. The most useful stable hooks are:

- `html[data-skin='retro98']` and `html[data-skin='modern']`
- `.topbar`, `.nav-pill`, `.settings-button`
- `.page`, `.page-heading-row`
- `.media-card`, `.poster-button`, `.media-rail`, `.media-grid`
- `.card-add`, `.card-watched`, `.card-up-to-date`, `.card-favorite`, `.card-rating`
- `.season`, `.episode-row`, `.check-hit-target`
- `.settings-card`, `.filter-panel`, `.watched-filter-panel`

Custom skins are CSS only. They do not get JavaScript execution or access to the local database through the skin system.

A skin can deliberately target one base skin or both. Keep touch/click targets large enough to preserve the app's one-click tracking workflow.


## Built-in color variables

The Appearance editor sets CSS variables that custom skins can reuse or override:

```css
--imtt-retro-accent
--imtt-retro-desktop
--imtt-retro-surface
--imtt-completion
--imtt-incomplete
--imtt-nav-discover
--imtt-nav-movies
--imtt-nav-shows
--imtt-nav-upcoming
--imtt-nav-history
--imtt-nav-stats
--imtt-tag-up-to-date
--imtt-tag-completed
--imtt-tag-dnf
--imtt-rating
--imtt-favorite
```
