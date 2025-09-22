import { delay, ok, badRequest, unauthorized, normalizeChoice } from './_lib/utils.js';
import { connectCosmos } from './_lib/cosmos.js';

export async function handler(event){
  await delay();
  if((event?.httpMethod || 'GET') !== 'POST') return badRequest('POST required');
  const db = await connectCosmos();
  const me = await db.sessions.get();
  if(!me || !me.username) return unauthorized();
  let body = {};
  try{ body = event?.body ? JSON.parse(event.body) : {}; }catch{}
  try{
    const choice = normalizeChoice(body.choice);
    await db.votes.upsert({ userId: me.username, choice });
    const summary = await db.votes.summary();
    return ok(summary);
  }catch(e){
    return badRequest(e.message || 'Invalid input');
  }
}
