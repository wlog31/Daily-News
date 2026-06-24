# Daily-News

## Article JSON build

Markdown files under `CLAUDE/` can be converted into static JSON files:

Double-click one of these launcher files:

- `Build Article Data - Windows.cmd`
- `Build Article Data - Mac.command`

Or run it from a terminal:

```bash
npm run build:data
```

On Windows PowerShell, if `npm` is blocked by the execution policy, use:

```bash
npm.cmd run build:data
```

The generated files are written to:

- `data/articles/index.json`
- `data/articles/all.json`
- `data/articles/dates/YYYY-MM-DD.json`
- `data/articles/categories/<category>.json`

The web app reads these static JSON files directly. After adding or editing markdown files, run the launcher again before deploying.
