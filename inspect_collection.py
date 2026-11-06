#!/usr/bin/env python3
"""Print what glen core will draw from a Portolan collection.

    python3 inspect_collection.py https://example.org/catalog/roads/collection.json

For each collection it lists the PMTiles layers, the published styles by the
name `"style"` takes in layers-input.json, the COG assets with their band
statistics, and the license. It reads the PMTiles archives' attribute names
too when the `pmtiles` Python package is installed (pip install pmtiles).
It uses only the standard library otherwise.
"""

import json
import sys
import urllib.request
from urllib.parse import urljoin

PMTILES_TYPE = "application/vnd.pmtiles"


def fetch_json(url):
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)


def style_name(key):
    return key[len("style-"):] if key.startswith("style-") and len(key) > 6 else key


def pmtiles_fields(url):
    """Attribute names per tile layer, or None without the pmtiles package."""
    try:
        from pmtiles.reader import Reader
    except ImportError:
        return None

    def get_bytes(offset, length):
        req = urllib.request.Request(url, headers={"Range": f"bytes={offset}-{offset + length - 1}"})
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.read()

    meta = Reader(get_bytes).metadata()
    return {layer["id"]: sorted(layer.get("fields", {})) for layer in meta.get("vector_layers", [])}


def inspect(url):
    c = fetch_json(url)
    print(f"# {c.get('id')}: {c.get('title', '')}")
    print(f"  license: {c.get('license', 'not stated')}")
    assets = c.get("assets", {})
    links = [l for l in c.get("links", []) if l.get("rel") == "pmtiles" or l.get("type") == PMTILES_TYPE]
    tiles = {urljoin(url, l["href"]): l.get("pmtiles:layers") for l in links}
    for a in assets.values():
        roles = a.get("roles", [])
        if a.get("type") == PMTILES_TYPE and "visual" in roles and "source" not in roles:
            tiles.setdefault(urljoin(url, a["href"]), None)
    for t, layers in tiles.items():
        print(f"  PMTiles: {t}" + (f"  layers {layers}" if layers else ""))
        fields = pmtiles_fields(t)
        if fields:
            for name, names in fields.items():
                print(f"    {name}: {', '.join(names)}")
    styles = [(k, a) for k, a in assets.items() if "style" in a.get("roles", []) and "source" not in a.get("roles", [])]
    for k, a in styles:
        default = " (default)" if "default" in a.get("roles", []) else ""
        print(f"  style \"{style_name(k)}\"{default}: {a.get('title', '')}")
    for k, a in assets.items():
        roles = a.get("roles", [])
        if "data" in roles and "source" not in roles and "geotiff" in str(a.get("type", "")):
            bands = a.get("bands") or a.get("raster:bands") or [{}]
            b = bands[0]
            stats = b.get("statistics", {})
            print(f"  COG \"{k}\": {urljoin(url, a['href'])}")
            print(f"    nodata {b.get('nodata')}, min {stats.get('minimum')}, max {stats.get('maximum')}, "
                  f"mean {stats.get('mean')}, unit {b.get('unit', '')}")
    if not tiles and not any("geotiff" in str(a.get("type", "")) for a in assets.values()):
        print("  nothing to draw: no PMTiles link or visual asset, and no COG data asset")
    print()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    for u in sys.argv[1:]:
        inspect(u)
