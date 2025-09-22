// Shared storage helpers for serverless running in browser

export const KEYS = {
  users: 'bm_users',
  votes: 'bm_votes',
  session: 'bm_session',
};

const hasLocal = typeof localStorage !== 'undefined';
const memory = (function(){
  if(typeof globalThis !== 'undefined'){
    globalThis.__DB = globalThis.__DB || {};
    return globalThis.__DB;
  }
  return {};
})();

export function load(key, fallback){
  if(hasLocal){
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch { return fallback; }
  }
  return key in memory ? memory[key] : fallback;
}

export function save(key, value){
  if(hasLocal){ localStorage.setItem(key, JSON.stringify(value)); return; }
  memory[key] = value;
}

