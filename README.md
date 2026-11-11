# glen-portolan-template

This repository is a template for a GLEN map app over any [Portolan](https://www.portolan-sdi.org/) catalog. The app shows the catalog's PMTiles and COG layers on a map, and a chat agent changes the map on request: it shows and hides layers, filters features, applies the publisher's styles or new colours, recolours rasters and moves the view. The agent can also run SQL over the collections' GeoParquet files with [geo-query-wasm](https://github.com/SchmidtDSE/geo-query-wasm), which runs DuckDB in the visitor's browser. The app is static files with no server of its own, and each visitor brings their own OpenRouter key.

- **Template repository:** https://github.com/SchmidtDSE/glen-portolan-template
- **Create your own:** https://github.com/new?template_owner=SchmidtDSE&template_name=glen-portolan-template
- **Example app:** https://schmidtdse.github.io/glen-portolan-template/ shows the [City of St. Louis open data mirror](https://data.source.coop/tge-labs/st-louis-open-data-mirror/catalog.json): neighborhoods, wards, 1930s redlining grades, the 2024 market value analysis, vacant and assessed parcels, census tracts, lead service lines, the May 2025 tornado and the floodplain

The app runs on glen core, the map-only part of [GLEN](https://github.com/SchmidtDSE/glen). Apps that need SQL on a server, hex layers or a server-side key start from [glen-template](https://github.com/SchmidtDSE/glen-template) instead.

## Portolan data

Any static catalog that follows the [Portolan specification](https://github.com/portolan-sdi/portolan-spec) works. The [Portolan registry](https://www.portolan-sdi.org/registry) lists the independently hosted public catalogs, 89 of them in November 2026, and its **Copy address** button gives the URL of each root `catalog.json`. The registry's source is [portolan-sdi/portolan-registry](https://github.com/portolan-sdi/portolan-registry). The [Portolan browser](https://browser.portolan-sdi.org/) opens any of them for a look before you build an app.

glen core draws two kinds of asset:

- vector tiles from a PMTiles archive, linked from the collection with `rel: "pmtiles"` or listed as an asset with the `visual` role;
- rasters from a Cloud-Optimized GeoTIFF listed on the collection as an asset with the `data` role.

A collection with only GeoParquet or other files has nothing to draw and is skipped. Rasters published as one COG per item are not drawn yet.

## SQL in the browser

The `plugins` entry in `layers-input.json` loads glen core's MCP plugin with one server, [geo-query-wasm](https://github.com/SchmidtDSE/geo-query-wasm), running in a Web Worker. The plugin adds geo-query's `query` tool to the map tools, answers `get_schema` and `get_stac_details` from the collections the app loaded, and lists in the system prompt the GeoParquet or Parquet asset with the `data` role of every loaded collection. The agent can then count, sum and rank the features behind each layer and join layers on shared keys. DuckDB loads in about 5 seconds and reads only the byte ranges a query needs. No query leaves the browser.

```json
"plugins": [{
    "url": "https://cdn.jsdelivr.net/gh/SchmidtDSE/glen@v3.47.0/core/plugins/mcp.js",
    "options": { "servers": [{
        "worker": "plugins/geo-query-worker.js",
        "worker_config": { "discovery": false },
        "include": ["query"]
    }] }
}]
```

A page may start a Worker only from its own origin, so `plugins/geo-query-worker.js` is a one-line file that imports geo-query-wasm's worker from jsDelivr. `include` keeps only `query`; geo-query-wasm's hex tiles need a map layer type that glen core does not have. To drop SQL, delete the `plugins` entry.

By default the SQL can read any `s3://` path and https URLs on source.coop and NRP. A catalog hosted elsewhere, such as the CARTO mirrors on Google Cloud Storage, needs its host in `worker_config`: `allowedDirectories` lists the paths SQL may read, and `allowedEndpoints` the S3 hosts a query may name with `s3_endpoint`, which is how `get_schema` points the model at other hosts. A list given there replaces geo-query-wasm's default list, so repeat the defaults you keep:

```json
"worker_config": {
    "discovery": false,
    "allowedEndpoints": ["s3-west.nrp-nautilus.io", "storage.googleapis.com"]
}
```

The [glen core README](https://github.com/SchmidtDSE/glen/blob/v3.47.0/core/README.md) and geo-query-wasm's [README](https://github.com/SchmidtDSE/geo-query-wasm#using-geo-query-wasm-from-an-app) list the other options.

## Quick start

These steps give you a running app over a whole catalog, published on GitHub Pages.

1. **Create your repository.** Open the "Create your own" link above, or click **Use this template** on the template repository, and name the new repository.
2. **Point it at your catalog.** In `layers-input.json`, replace the `collections` list and the `view` block with one line naming your root catalog:

   ```json
   "catalog": "https://data.source.coop/cholmes/trimet/catalog.json",
   ```

   The app then loads every collection under that catalog, up to 25, and opens the map on their extent.
3. **Name the app.** Set `sidebar.title` in `layers-input.json` and the `<title>` in `index.html`. Point `links.github` at your repository, and set `links.contact` to your own email address or contact page.
4. **Rewrite the welcome text.** `welcome.message` and `welcome.examples` are the first thing a visitor reads in the chat. Write examples that name your layers.
5. **Turn on GitHub Pages.** In your repository's **Settings → Pages**, set the source to **GitHub Actions**. Then push to `main`, or re-run the workflow under **Actions**. The site appears at `https://<owner>.github.io/<repository>/`.

Steps 2 to 4 can be done in the GitHub web editor, so no local checkout is needed.

## Collection choices

Loading a whole catalog shows every layer, all switched off at the start. To choose the layers, name them, group them and pick their styles, list collections instead:

```json
"collections": [
    {
        "url": "https://data.source.coop/cholmes/trimet/routes/collection.json",
        "display_name": "Bus and rail routes",
        "group": "Transit",
        "visible": true,
        "style": "frequent-service",
        "tooltip": ["rte_desc", "type"]
    },
    "https://data.source.coop/cholmes/trimet/rail-stops/collection.json"
]
```

`inspect_collection.py` prints what you need to write these entries. Give it a catalog or a collection URL:

```bash
python3 inspect_collection.py https://data.source.coop/cholmes/trimet/catalog.json
```

For each collection it prints the `collection.json` URL, the license, the PMTiles layers with their attribute names, the published style names exactly as `style` takes them, and the COG assets with their band statistics. It needs only the Python standard library; `pip install pmtiles` adds the attribute names.

The app reads everything else from the catalog. Tile layer names and attribute names come from the PMTiles archives. Starting colours and alternative styles come from each collection's published MapLibre styles. Raster display ranges come from the band statistics. Licenses and citations come from the collection records and appear on the **Data** page linked from the header. [AGENTS.md](AGENTS.md) lists every option.

## Repository structure

```
index.html              the page; loads MapLibre, PMTiles and glen core from CDNs
layers-input.json       the collections to show, the map view, links, plugins, models and welcome text
plugins/                the worker file that starts geo-query-wasm
inspect_collection.py   prints what the app will draw from a catalog or collection
AGENTS.md               the configuration reference, for people and coding agents
.github/workflows/      deploys the repository to GitHub Pages on every push to main
```

You configure the app by editing `layers-input.json` and the title in `index.html`. You do not write JavaScript; `plugins/geo-query-worker.js` works unchanged over any catalog.

## Local development

```bash
python -m http.server 8000
```

Open http://localhost:8000 and enter an OpenRouter key under the settings button in the chat panel. The browser console reports how many collections and layers loaded, and names any collection the app could not read or found nothing to draw in.

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

`index.html` loads glen core from jsDelivr, pinned to a release of `SchmidtDSE/glen`, currently `v3.47.0`. Every `cdn.jsdelivr.net/gh/SchmidtDSE/glen@` URL in `index.html` and `layers-input.json` names the same tag, and they change together. [AGENTS.md](AGENTS.md) describes how to move the pin.

## More resources

- [glen core](https://github.com/SchmidtDSE/glen/blob/v3.47.0/core/README.md): how the app reads Portolan catalogs, its plugins and its limitations
- [Portolan specification](https://github.com/portolan-sdi/portolan-spec) and [Portolan CLI](https://cli.portolan-sdi.org/), for publishing a catalog of your own
- [geo-query-wasm](https://github.com/SchmidtDSE/geo-query-wasm): geo-query's MCP server in a Web Worker, which the plugin starts
- [glen-template](https://github.com/SchmidtDSE/glen-template): the full GLEN app with SQL over MCP
