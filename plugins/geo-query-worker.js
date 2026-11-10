/**
 * The geo-query-wasm worker, started from this app's own origin.
 *
 * A page may start a Worker only from its own origin, so this file stands in
 * for geo-query-wasm's src/worker.js and imports it from jsDelivr. The worker
 * reads its configuration from this file's URL (`?config=…`), which
 * geo-query-wasm.js sets.
 *
 * The pin names a commit of SchmidtDSE/geo-query-wasm. Its latest tag, v0.3.1,
 * predates the query time limit and the hex tools.
 */
import 'https://cdn.jsdelivr.net/gh/SchmidtDSE/geo-query-wasm@dad59aa7edde77bf7e51f3f1d22154af1cc8b6cc/src/worker.js';
