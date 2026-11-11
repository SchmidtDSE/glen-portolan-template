# Agent guide for glen-portolan-template

This file is the configuration reference for apps made from this template. It is written for the people and coding agents who set one up.

## Repository relationship

An app made from this template is a few static files. `index.html` loads glen core from jsDelivr, pinned to a commit or tag of [SchmidtDSE/glen](https://github.com/SchmidtDSE/glen), and glen core reads `layers-input.json` from the same directory. glen core's MCP plugin adds SQL: it starts [geo-query-wasm](https://github.com/SchmidtDSE/geo-query-wasm) in a Web Worker from `plugins/geo-query-worker.js`, which imports the worker from jsDelivr at a pinned commit. A page may start a Worker only from its own origin, hence the local file. The map, chat, agent loop and map tools all live in glen's `core/` directory, so a change to how the app behaves belongs there, not here.

## Configuration scope

You edit `layers-input.json`, the `<title>` in `index.html`, the glen pin in `index.html`, and the geo-query-wasm pin in `plugins/geo-query-worker.js`. You do not write JavaScript or copy glen's modules into the app.

## Setup procedure

1. Get the root `catalog.json` URL. The [Portolan registry](https://www.portolan-sdi.org/registry) lists public catalogs; its **Copy address** button gives the URL. Setting only `catalog`, with no `collections`, already gives a working app over the whole catalog.
2. Run `python3 inspect_collection.py <catalog.json or collection.json URL>`. Given a catalog, it follows the `child` links to every collection. For each it prints the PMTiles layers and their attribute names, the published styles by the name the `style` option takes, the COG assets with their band statistics, and the license. It needs only the Python standard library, plus `pip install pmtiles` to list attribute names.
3. To choose, name and style the layers, write the `collections` list. Use the printed style names for `style` and the printed attribute names for `tooltip` and `default_filter`.
4. Set `view`, `sidebar.title`, the `<title>`, `links` and the `welcome` examples. Write the examples with layer names and values that exist in the data.
5. Serve the directory with `python -m http.server 8000` and open http://localhost:8000. Check that every layer appears in the layer panel, that each draws when switched on, and that the browser console has no `[Portolan]` warnings.

## Top-level fields in `layers-input.json`

| Field | Meaning |
|---|---|
| `collections` | The collections to show; see below |
| `catalog` | A root `catalog.json` URL. With it, collections can be named by id; without `collections`, every collection under it is loaded |
| `max_collections` | The limit when loading a whole catalog; default 25 |
| `titiler_url` | The TiTiler server that draws COG tiles; default `https://titiler.nrp-nautilus.io` |
| `view` | `{ "center": [lon, lat], "zoom": z }`, with optional `pitch`, `bearing` and `globe`. Without it the map opens on the extent of the data |
| `default_basemap` | `"natgeo"`, `"satellite"` or `"plain"` |
| `sidebar` | `{ "enabled": true, "title": "…", "chat_title": "…" }` |
| `header` | Optional header band with logos and links; see the [GLEN configuration guide](https://github.com/SchmidtDSE/glen/blob/main/docs/guide/configuration.md) |
| `links` | Header links. `github` adds a GitHub link; `contact` sets Contact us, an email address or URL, and defaults to `mailto:dse@berkeley.edu`; `data: false` removes the Data page link |
| `theme` | `"light"`, `"dark"` or `"auto"` |
| `welcome` | `{ "message": "…", "examples": ["…"] }`, shown when the chat opens |
| `llm` | The model list; see below |
| `auto_approve` | Run tool calls without asking the visitor; default true |
| `geocoder` | Geocoder settings; place-name search is on by default |
| `system_prompt_url` | A Markdown file that replaces glen core's base system prompt |
| `plugins` | ES modules that extend the app; see the glen core README and the geo-query-wasm plugin below |

## Collection entries

An entry is a `collection.json` URL, a collection id when `catalog` is set, or an object:

| Field | Applies to | Meaning |
|---|---|---|
| `url` | all | The collection's `collection.json` |
| `id` | all | A layer id to use instead of the collection id |
| `display_name` | all | The name in the layer panel and legend |
| `visible` | all | Switched on when the app opens |
| `group` | all | The layer panel group |
| `style` | vector | The published style to start with; default is the style asset with the `default` role |
| `paint` | vector | MapLibre paint properties to use instead of the published style's |
| `default_filter` | vector | A MapLibre filter applied at start |
| `tooltip` | vector | Attribute names shown on hover; default is a name field and the styled attribute |
| `colormap` | raster | A TiTiler colour map name, such as `viridis` or `magma` |
| `rescale` | raster | The display range as `"min,max"`; default runs from the minimum to the mean plus two standard deviations |
| `opacity` | raster | Layer opacity from 0 to 1 |

A collection with several drawable assets becomes several layers, with ids `<collection id>/<asset key>`.

## Filter syntax

Filters use MapLibre expressions with attribute names exactly as they appear in the tiles:

```json
"default_filter": ["==", ["get", "Damage"], "road_damage"]
"default_filter": [">", ["get", "share_damaged"], 0.5]
"default_filter": ["match", ["get", "adm1_name"], ["Kingston", "St. Andrew"], true, false]
```

The legacy form `["in", "field", "a", "b"]` does nothing in current MapLibre.

## LLM configuration

```json
"llm": {
    "user_provided": true,
    "default_endpoint": "https://openrouter.ai/api/v1",
    "models": [
        { "value": "~deepseek/deepseek-v4-flash-latest", "label": "DeepSeek V4 Flash" }
    ]
}
```

The first model is the default. Keep to models that OpenRouter serves through a zero-data-retention provider; its `GET https://openrouter.ai/api/v1/endpoints/zdr` lists them. Never put an API key in this repository. `config.json` is ignored by git for that reason.

## SQL with geo-query-wasm

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

| Server field | Meaning |
|---|---|
| `worker` | The worker file, relative to the page |
| `worker_config` | geo-query-wasm's worker options, such as `allowedDirectories`, `allowedEndpoints`, `timeout` and `workers`. A list given here replaces geo-query-wasm's default list |
| `include` or `exclude` | Tool names to keep or drop. Keep `include: ["query"]`: glen core cannot draw geo-query-wasm's hex tiles, and the plugin answers the catalog tools itself |
| `prompt` | An MCP prompt to append to the system prompt, such as `geospatial-analyst` |

The plugin lists every collection's Parquet `data` asset in the system prompt. By default the SQL reads any `s3://` path and https URLs on source.coop and NRP. For a catalog hosted elsewhere, add its host to `allowedEndpoints` (S3 hosts a query names with `s3_endpoint`, the route `get_schema` gives for other hosts) or `allowedDirectories` (paths SQL may read). Check a new catalog's data host before relying on SQL.

Geometry columns reach SQL as WKB blobs, so spatial SQL needs `ST_GeomFromWKB(geometry)`.

To move the geo-query-wasm pin, change the commit in `plugins/geo-query-worker.js` and check that jsDelivr serves it. Its tags lag main; v0.3.1 has no query time limit or hex tools.

## GLEN pin

Every `cdn.jsdelivr.net/gh/SchmidtDSE/glen@<ref>` URL names the same ref: in `index.html` the favicon, three stylesheets and `core/main.js`, and in `layers-input.json` the MCP plugin. To move the pin, replace the ref in all six and check that jsDelivr serves it:

```bash
curl -sI https://cdn.jsdelivr.net/gh/SchmidtDSE/glen@<ref>/core/main.js | head -1   # HTTP/2 200
```

Pin a release tag when one includes glen core. Never pin `@main`.

## Problem reports

| Symptom | Where it belongs |
|---|---|
| A wrong URL, style name, attribute name or filter | This repository |
| A layer the catalog describes correctly but the app draws wrongly or not at all | `SchmidtDSE/glen`, naming glen core and the collection URL |
| A missing license, wrong statistics, a broken PMTiles link or other catalog defect | The catalog's publisher, listed under `providers` in the collection |
