# glen-portolan-template

This repository is a template for a GLEN map app over any [Portolan](https://www.portolan-sdi.org/) catalog. The app shows the catalog's PMTiles and COG layers on a map, and a chat agent changes the map on request: it shows and hides layers, filters features, applies the publisher's styles or new colours, recolours rasters and moves the view. The agent runs no queries, and the app is two static files with no server of its own. Each visitor brings their own OpenRouter key.

The example configuration shows Jamaica after Hurricane Melissa: https://schmidtdse.github.io/glen-portolan-template/

The app runs on glen core, the map-only part of [GLEN](https://github.com/SchmidtDSE/glen). Apps that also need SQL over MCP, hex layers or a server-side key start from [glen-template](https://github.com/SchmidtDSE/glen-template) instead.

## Repository structure

```
index.html          the page; loads MapLibre, PMTiles and glen core from CDNs
layers-input.json   the collections to show, the map view, the models offered and the welcome text
AGENTS.md           the configuration reference, for people and coding agents
.github/workflows/  deploys the repository to GitHub Pages on every push to main
```

You configure the app by editing `layers-input.json` and the title in `index.html`. You do not write JavaScript.

## Quick start

### 1. Create your repository

Click **Use this template** on GitHub, or copy these files into a new repository.

### 2. Find a Portolan catalog

Any static catalog that follows the Portolan specification works. The [Portolan registry](https://www.portolan-sdi.org/registry) lists public ones. You need the URL of each collection's `collection.json`, or the URL of the root `catalog.json`.

glen core draws two kinds of asset:

- vector tiles, from a PMTiles archive linked with `rel: "pmtiles"` or listed as an asset with the `visual` role;
- rasters, from a Cloud-Optimized GeoTIFF listed as an asset with the `data` role.

A collection with only GeoParquet or other files has nothing to draw and is skipped.

### 3. List your collections

Replace `collections` in `layers-input.json`. The shortest form is a list of URLs:

```json
"collections": [
    "https://example.org/catalog/roads/collection.json",
    "https://example.org/catalog/population/collection.json"
]
```

Each entry can also be an object that sets the layer name, group, starting visibility, the published style to start with, and the hover tooltip:

```json
{
    "url": "https://example.org/catalog/roads/collection.json",
    "display_name": "Road closures",
    "group": "Transport",
    "visible": true,
    "style": "categorical",
    "tooltip": ["name", "status"]
}
```

With a root `catalog` URL set, collections can be named by id, and with no `collections` list at all the app loads every collection in the catalog, up to 25. `AGENTS.md` lists every option.

The app reads the rest from the catalog. Tile layer names and attribute names come from the PMTiles archives. Starting colours and alternative styles come from each collection's published MapLibre styles. Raster display ranges come from the band statistics. Licenses and citations come from the collection records and appear on the **Data** page linked from the header.

### 4. Set the view and the text

- `view` sets the map's starting centre and zoom. Without it the map opens on the extent of all loaded collections.
- `sidebar.title` and the `<title>` in `index.html` name the app.
- `welcome.message` and `welcome.examples` are the first thing a visitor reads in the chat. Write examples that name your layers and values.

### 5. Deploy

1. Push to `main`.
2. In the repository's **Settings → Pages**, set the source to **GitHub Actions**.
3. The workflow in `.github/workflows/gh-pages.yml` publishes the site at `https://<owner>.github.io/<repository>/` on every push to `main`.

Any static host works the same way: serve `index.html` and `layers-input.json` from one directory.

## Local development

```bash
python -m http.server 8000
```

Open http://localhost:8000 and enter an OpenRouter key under the settings button in the chat panel. The browser console names any collection the app could not read or found nothing to draw in.

## Models and keys

The chat sends requests from the browser to OpenRouter with the key the visitor enters; the key stays in that browser's local storage. `llm.models` sets the models offered, and the first is the default. The list in this template holds low-cost models that call tools reliably and that OpenRouter serves through at least one zero-data-retention provider:

| Model | OpenRouter id |
|---|---|
| DeepSeek V4 Flash | `~deepseek/deepseek-v4-flash-latest` |
| Nemotron 3.5 Super | `nvidia/nemotron-3.5-super-vl` |
| GLM-5.3 Flash | `z-ai/glm-5.3-flash` |
| MiniMax M3.1 Flash | `minimax/minimax-m3.1-flash` |

OpenRouter applies zero data retention only when the account requires it, under **Settings → Privacy** on openrouter.ai. Any OpenAI-compatible endpoint works in place of OpenRouter. A deployment that holds its own key serves a `config.json` with `llm_models` instead, as [glen-template](https://github.com/SchmidtDSE/glen-template) does on Kubernetes.

## GLEN version

`index.html` loads glen core from jsDelivr, pinned to one commit of `SchmidtDSE/glen`. Every `cdn.jsdelivr.net/gh/SchmidtDSE/glen@` URL in the file names the same ref, and they change together. The pin is currently a commit on the unmerged `core-portolan` branch; once glen core is in a release, it moves to that tag.

## More resources

- [glen core](https://github.com/SchmidtDSE/glen/blob/core-portolan/core/README.md): how the app reads Portolan catalogs, its plugins and its limitations
- [Portolan specification](https://www.portolan-sdi.org/)
- [glen-template](https://github.com/SchmidtDSE/glen-template): the full GLEN app with SQL over MCP
