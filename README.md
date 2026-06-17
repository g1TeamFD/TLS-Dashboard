# TLS Dashboard

React + Vite dashboard for the TLS program.

## Release Model

- `main` is the live production branch.
- Each push to `main` deploys a new production build through GitHub Actions and GitHub Pages.
- For each real release:
  - update the app/package version,
  - commit the change,
  - tag the release,
  - preferably create a GitHub Release.
- First GitHub-controlled release: `v0.7.0`.

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The production bundle is generated in `dist/`. `dist/` and `node_modules/` are intentionally not committed.

## GitHub Pages Deployment

GitHub Pages should be configured with:

- Source: GitHub Actions
- Production branch: `main`

The deployment workflow is in `.github/workflows/deploy.yml`. On each push to `main`, it installs dependencies with `npm ci`, runs `npm run build`, uploads `dist/`, and deploys it to Pages.

`vite.config.js` automatically sets the GitHub Pages base path from `GITHUB_REPOSITORY` during GitHub Actions builds. For a project site such as `https://USERNAME.github.io/REPO_NAME/`, it builds with `base: "/REPO_NAME/"`. Local builds use `base: "/"`.

If this is later moved to a custom domain or a `USERNAME.github.io` root site, verify the base path before release.

## Manual Data Refresh

Current dashboard data is manually refreshed:

1. Update the live processed Google Sheet.
2. Run the Apps Script CSV export.
3. Download the approved CSV files.
4. Rebuild the local snapshot JSON.
5. Replace `src/data/tls-dashboard-data.json`.
6. Run `npm run build`.
7. Review the dashboard locally.
8. Commit and push the new snapshot.

GitHub Pages is public on the internet. Before pushing a data refresh to `main`, confirm that the bundled JSON data is approved for public publishing, or anonymize/restrict the deployment first.

## Future Data Automation

Stage 8.3 / post-V1 work: automate the data sync so GitHub Actions can pull approved live data from Google Drive or Google Sheets, rebuild the dashboard snapshot, and deploy after validation.
