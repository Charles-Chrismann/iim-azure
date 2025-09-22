/**
 * Cosmos DB client for serverless handlers.
 *
 * This mimics the shape and flow of connecting to Azure Cosmos DB using
 * the official SDK, but keeps data in localStorage (or in‑memory fallback)
 * so the demo can run entirely in the browser or a mocked environment.
 *
 * In production (real serverless runtime):
 *
 *   import { CosmosClient } from '@azure/cosmos';
 *   const client = new CosmosClient({ endpoint: process.env.COSMOS_ENDPOINT, key: process.env.COSMOS_KEY });
 *   const db = client.database('bayroumeter');
 *   const users = db.container('users');   // partitionKey: '/id'
 *   const votes = db.container('votes');   // partitionKey: '/userId'
 *   // Then use users.item(id, pk).read() / items.query(query).fetchAll() / items.upsert(doc) etc.
 */

import { KEYS, load, save } from './storage.js';

// A tiny helper to simulate async connection establishment.
async function simulateConnection(){ return; }

// Expose a single connect function returning container‑like helpers.
export async function connectCosmos(){
  // In a real function, you’d validate required env vars before connecting:
  // const endpoint = process.env.COSMOS_ENDPOINT; const key = process.env.COSMOS_KEY;
  // if(!endpoint || !key) throw new Error('Missing Cosmos credentials');
  await simulateConnection();

  return {
    users: usersContainer(),
    votes: votesContainer(),
    sessions: sessionsContainer(),
  };
}

// --- Users container (id = username) ---
function usersContainer(){
  return {
    /** Read a user document by id (username). */
    async get(username){
      const users = load(KEYS.users, {});
      const u = users[username];
      return u ? { id: username, ...u } : null;
    },
    /** Create a user document; error if already exists. */
    async create({ id, password }){
      const users = load(KEYS.users, {});
      if(users[id]) throw new Error('User already exists');
      users[id] = { password, createdAt: Date.now() };
      save(KEYS.users, users);
      return { id, password };
    }
  };
}

// --- Votes container (partition by userId) ---
function votesContainer(){
  return {
    /** Upsert a vote document for a user. */
    async upsert({ userId, choice }){
      const votes = load(KEYS.votes, {});
      votes[userId] = choice;
      save(KEYS.votes, votes);
      return { id: userId, userId, choice };
    },
    /** Read current vote for a user. */
    async getByUser(userId){
      const votes = load(KEYS.votes, {});
      return votes[userId] || null;
    },
    /** Aggregate results similarly to a COUNT query in Cosmos. */
    async summary(){
      const votes = load(KEYS.votes, {});
      const users = Object.keys(votes);
      const yes = users.filter(u => votes[u] === 'yes').length;
      const no = users.filter(u => votes[u] === 'no').length;
      const total = yes + no;
      const pct = (n) => total ? Math.round((n/total)*100) : 0;
      return { total, yes, no, pctYes: pct(yes), pctNo: pct(no) };
    }
  };
}

// --- Sessions helper (not a typical container; just demo state) ---
function sessionsContainer(){
  return {
    /** Return current session if set. In real world, use cookies/JWT. */
    async get(){
      return load(KEYS.session, null);
    },
    /** Set session for a user. In real world, issue a token and set cookie. */
    async set(username){
      const session = { username, token: makeToken(), ts: Date.now() };
      save(KEYS.session, session);
      return session;
    },
    /** Clear session. */
    async clear(){
      if(typeof localStorage !== 'undefined') localStorage.removeItem(KEYS.session);
    }
  };
}

function makeToken(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }

