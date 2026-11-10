/**
 * geo-query-wasm plugin for glen core: SQL over the app's GeoParquet, in the
 * visitor's browser.
 *
 * geo-query-wasm is geo-query's MCP server running in a Web Worker on
 * DuckDB-wasm (https://github.com/SchmidtDSE/geo-query-wasm). This plugin
 * starts the worker, connects glen-harness's MCP client to it over
 * postMessage, and registers its tools beside the map tools. No server is
 * involved: DuckDB reads the parquet files by byte range, and the questions
 * go only to the model endpoint.
 *
 *   "plugins": [{
 *     "url": "plugins/geo-query-wasm.js",
 *     "options": {
 *       "include": ["query"],          // or "exclude": [...]
 *       "worker": { "discovery": false } // geo-query-wasm's worker options
 *     }
 *   }]
 *
 * The worker's SQL may read only `s3://` paths and https URLs on NRP and
 * source.coop unless `worker.allowedDirectories` says otherwise, so the
 * collections' parquet assets should live there.
 *
 * glen core's own plugins/mcp.js reaches servers over Streamable HTTP only,
 * so this one supplies the postMessage transport.
 */

// The same glen-harness tag as glen core's main.js and plugins/mcp.js.
const HARNESS = 'https://cdn.jsdelivr.net/gh/SchmidtDSE/glen-harness@v0.4.0/src';

export default {
    name: 'geo-query-wasm',

    async setup(ctx, options = {}) {
        const [{ MCPClient }, { PostMessageTransport }] = await Promise.all([
            import(`${HARNESS}/mcp-client.js`),
            import(`${HARNESS}/post-message-transport.js`),
        ]);
        const url = new URL('./geo-query-worker.js', import.meta.url);
        url.searchParams.set('config', JSON.stringify(options.worker || {}));
        const worker = new Worker(url, { type: 'module' });
        worker.addEventListener('error', (e) => console.error('[geo-query-wasm] worker error:', e.message));

        const t0 = performance.now();
        const client = new MCPClient('worker:geo-query-wasm', {}, {
            transport: () => new PostMessageTransport(worker),
            clientInfo: { name: `glen-core/${ctx.version}`, version: ctx.version },
        });
        await client.connect();
        const count = ctx.tools.registerRemote(client.getTools(), client, null, {
            rank: 0, include: options.include, exclude: options.exclude,
        });
        console.log(`[geo-query-wasm] ${count} tools in ${((performance.now() - t0) / 1000).toFixed(1)} s`);

        ctx.addPrompt(parquetSection(ctx.catalog));
        ctx.addPrompt([
            '## SQL in the browser',
            '',
            'The `query` tool runs DuckDB SQL in the visitor\'s browser. Read a layer\'s data with '
            + '`read_parquet(\'<url>\')`, using the URLs in the data file list, and select only the columns you need. '
            + 'Use `describe_layer` for column names and meanings. Geometry columns are dropped from results, '
            + 'so join layers on shared keys (ward, neighborhood, parcel id) or with spatial functions such as '
            + '`ST_Intersects` and `ST_Centroid` inside the query.',
        ].join('\n'));
        if (options.prompt) {
            try {
                const text = await client.getPrompt(options.prompt);
                if (text) ctx.addPrompt(text);
            } catch (err) {
                console.warn(`[geo-query-wasm] Prompt "${options.prompt}" unavailable:`, err.message);
            }
        }
    },
};

/**
 * The parquet `data` assets of every loaded collection, so the SQL can read
 * the data behind each map layer. The same rule as parquetSection in glen
 * core's plugins/mcp.js.
 */
export function parquetSection(catalog) {
    const lines = [];
    for (const ds of catalog.getAll()) {
        for (const a of Object.values(ds.stac?.assets || {})) {
            const roles = a.roles || [];
            if (!roles.includes('data') || roles.includes('source')) continue;
            if (!String(a.type || '').includes('parquet')) continue;
            lines.push(`- ${ds.id}: ${new URL(a.href, ds.url).href}`);
        }
    }
    return lines.length ? ['## Data files for SQL', '', ...lines].join('\n') : '';
}
