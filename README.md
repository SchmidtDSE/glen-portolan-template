# glen-portolan

An example app built on glen core, the smallest GLEN app. It shows Portolan catalogs on a map, and a chat agent changes the map for you: it shows and hides layers, filters features, applies the publisher's styles or new colours, recolours rasters and moves the view. The agent runs no queries, and the app needs no server of its own. Each user brings their own OpenRouter key.

**Live app:** https://schmidtdse.github.io/glen-portolan/

## Data

The map shows Jamaica after Hurricane Melissa (October 2025), from three Portolan catalogs that CARTO hosts as mirrors of the original publishers:

| Layer | Collection | Format | License |
|---|---|---|---|
| Parishes | [ocha-cod-jamaica/parishes](https://storage.googleapis.com/carto-open-catalogs/ocha-cod-jamaica/main/parishes/collection.json) | PMTiles | CC-BY-3.0-IGO |
| Building damage by parish | [hurricane-melissa-impact/building-damage-parishes](https://storage.googleapis.com/carto-open-catalogs/hurricane-melissa-impact/main/building-damage-parishes/collection.json) | PMTiles | CC-BY-4.0 |
| Building damage by H3 cell | [hurricane-melissa-impact/building-damage-h3](https://storage.googleapis.com/carto-open-catalogs/hurricane-melissa-impact/main/building-damage-h3/collection.json) | PMTiles | CC-BY-4.0 |
| Road damage and blockages | [hurricane-melissa-impact/road-blockages](https://storage.googleapis.com/carto-open-catalogs/hurricane-melissa-impact/main/road-blockages/collection.json) | PMTiles | CC-BY-4.0 |
| Children per 1 km cell | [worldpop-jamaica/children-grid-1km](https://storage.googleapis.com/carto-open-catalogs/worldpop-jamaica/main/children-grid-1km/collection.json) | PMTiles | CC-BY-4.0 |
| Children aged 0 to 19 and 0 to 4 at 100 m | [worldpop-jamaica/children-0-19](https://storage.googleapis.com/carto-open-catalogs/worldpop-jamaica/main/children-0-19/collection.json), [children-0-4](https://storage.googleapis.com/carto-open-catalogs/worldpop-jamaica/main/children-0-4/collection.json) | COG | CC-BY-4.0 |

The app reads everything it shows from the catalogs: tile layer names and attributes from the PMTiles archives, starting colours and alternative styles from each collection's published MapLibre styles, and raster display ranges from the band statistics. Raster tiles are drawn by TiTiler. The **Data** link in the header lists every collection with its citation.

## Files

```
index.html          the page; loads MapLibre, PMTiles and glen core from CDNs
layers-input.json   the collections to show, the models offered, and the welcome text
.github/workflows/  deploys the repository to GitHub Pages on every push to main
```

## Customization

1. Copy this repository.
2. In `layers-input.json`, list the `collection.json` URL of each Portolan collection you want. The [Portolan registry](https://www.portolan-sdi.org/registry) lists public catalogs. Set `display_name`, `group`, `visible`, and for vector layers the name of a published `style`.
3. Change the title in `index.html` and the sidebar title and welcome text in `layers-input.json`.
4. Turn on GitHub Pages with the source set to GitHub Actions.

The configuration options are documented in [core/README.md](https://github.com/SchmidtDSE/glen/blob/core-portolan/core/README.md) in the glen repository.

## Models and keys

The app sends chat requests from the browser to OpenRouter with the key the user enters under the settings button; the key stays in that browser's local storage. `llm.models` in `layers-input.json` sets the models offered. Any OpenAI-compatible endpoint works; a deployment that holds its own key can serve a `config.json` with `llm_models` instead, as in [glen-template](https://github.com/SchmidtDSE/glen-template).

## Version

`index.html` pins glen to commit `f0897ce` of the `core-portolan` branch, which is not yet merged. Once glen core is in a release, the pin should move to that tag.
