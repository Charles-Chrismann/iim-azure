// Utilities shared by serverless handlers
import { KEYS, load, save } from './storage.js';

export const LATENCY_MIN = 350;
export const LATENCY_JITTER = 400;

export function delay(ms = LATENCY_MIN + Math.floor(Math.random()*LATENCY_JITTER)){
  return new Promise(res => setTimeout(res, ms));
}

export function ok(data){
  return json(200, data);
}
export function badRequest(message){
  return json(400, { error: message });
}
export function unauthorized(message = 'Unauthorized'){
  return json(401, { error: message });
}
export function conflict(message){
  return json(409, { error: message });
}
export function noContent(){
  return { statusCode: 204, headers: cors(), body: '' };
}

export function json(statusCode, body){
  return { statusCode, headers: cors(), body: JSON.stringify(body) };
}

export function cors(){
  return { 'Content-Type': 'application/json' };
}

export function parseBody(event){
  if(!event || !event.body) return {};
  try{ return typeof event.body === 'string' ? JSON.parse(event.body) : event.body; }
  catch{ return {}; }
}

export function sanitizeUser(u){ return (u || '').trim().toLowerCase(); }
export function assertNonEmpty(x, msg){ if(!x || !String(x).trim()) throw new Error(msg); }
export function makeToken(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }
export function normalizeChoice(c){
  const v = String(c || '').toLowerCase();
  if(v !== 'yes' && v !== 'no') throw new Error('Invalid vote');
  return v;
}

export function summarizeVotes(){
  const votes = load(KEYS.votes, {});
  const users = Object.keys(votes);
  const yes = users.filter(u => votes[u] === 'yes').length;
  const no = users.filter(u => votes[u] === 'no').length;
  const total = yes + no;
  const pct = (n) => total ? Math.round((n/total)*100) : 0;
  return { total, yes, no, pctYes: pct(yes), pctNo: pct(no) };
}

export function getSession(){ return load(KEYS.session, null); }
export function setSession(username){
  const session = { username, token: makeToken(), ts: Date.now() };
  save(KEYS.session, session);
  return session;
}
export function clearSession(){ if(typeof localStorage !== 'undefined') localStorage.removeItem(KEYS.session); }

export { KEYS, load, save };

