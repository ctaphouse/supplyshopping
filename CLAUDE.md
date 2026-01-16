# Supply Shopping PWA

A mobile-friendly Progressive Web App for managing shopping lists organized by categories.

## Tech Stack

- Vanilla JavaScript (no framework)
- CSS (no preprocessor)
- Service Worker for offline support
- localStorage for data persistence

## Project Structure

```
pwa/                    # Main application (deployed to GitHub Pages)
├── app.js              # Application logic - single file architecture
├── styles.css          # All styles
├── index.html          # Entry point
├── sw.js               # Service Worker for offline/caching
├── manifest.json       # PWA manifest
├── Supply_Master.json  # Default supply data
└── icon-*.svg          # PWA icons
```

## Deployment

- Hosted on GitHub Pages
- Auto-deploys on push to `master` via `.github/workflows/deploy.yml`
- Only the `pwa/` directory is deployed

## Development

No build step required. Open `pwa/index.html` directly in a browser or use a local server:

```bash
cd pwa && python -m http.server 8000
```

## Architecture Notes

- Single-page app with tab-based navigation (Shopping, All Items, Categories, Settings)
- All state stored in localStorage
- Categories have color coding
- Items belong to categories and can be added to shopping list
