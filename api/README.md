Serverless API (browser-mocked)

This folder mimics serverless function endpoints (Netlify-style `exports.handler`).
They run in the browser and use `localStorage` to persist data with a small delay
to simulate network/server time.

Cosmos DB (mimicked)

- Handlers call a tiny wrapper in `api/_lib/cosmos.js` which simulates connecting
  to Azure Cosmos DB containers (`users`, `votes`) and a simple `sessions` helper.
- In a real serverless environment, replace this with the official `@azure/cosmos`
  client, e.g.:

  - Read endpoint and key from env vars: `process.env.COSMOS_ENDPOINT`, `process.env.COSMOS_KEY`.
  - Initialize client: `new CosmosClient({ endpoint, key })`.
  - Get database/containers: `client.database('bayroumeter').container('votes')`.
  - Use `items.upsert({ ... })`, `item(id, pk).read()`, or `items.query(query).fetchAll()`.
  - Choose appropriate partition keys (e.g., `/id` for users, `/userId` for votes).

Endpoints

- `api/register.js` (POST { username, password }) → 200 { username }
- `api/login.js` (POST { username, password }) → 200 { username }
- `api/logout.js` (POST) → 200
- `api/me.js` (GET) → 200 | 204 with current session
- `api/vote.js` (POST { choice: 'yes'|'no' }) → 200 results
- `api/my-vote.js` (GET) → 200 { vote|null }
- `api/results.js` (GET) → 200 results

Usage in-browser (demo)

```js
// Example: call the serverless with the demo client
import { invoke } from './api/_demoClient.js';

await invoke('register', { method: 'POST', body: { username: 'alice', password: 'pw' } });
await invoke('login', { method: 'POST', body: { username: 'alice', password: 'pw' } });
await invoke('vote', { method: 'POST', body: { choice: 'yes' } });
const res = await invoke('results', { method: 'GET' });
console.log(res);
```

Notes

- All storage is local to the browser (localStorage). This is a demo only.
- The shapes mirror typical serverless responses: `{ statusCode, headers, body }`.
- See `_lib/utils.js` for shared helpers and response builders.
