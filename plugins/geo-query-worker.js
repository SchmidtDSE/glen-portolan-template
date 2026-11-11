/**
 * The geo-query-wasm worker, started from this app's own origin.
 *
 * glen core's MCP plugin starts this file as a Web Worker for the server entry
 * in layers-input.json that names it with `worker`. A page may start a Worker
 * only from its own origin, so this file stands in for geo-query-wasm's
 * src/worker.js and imports it from jsDelivr. The worker reads the entry's
 * `worker_config` from this file's URL (`?config=…`).
 *
 * The pin names a release of SchmidtDSE/geo-query-wasm.
 */
import 'https://cdn.jsdelivr.net/gh/SchmidtDSE/geo-query-wasm@v0.6.0/src/worker.js';
