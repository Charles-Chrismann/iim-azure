import { delay, ok, unauthorized } from './_lib/utils.js';
import { connectCosmos } from './_lib/cosmos.js';

export async function handler(){
  await delay();
  // In production: read vote by userId from Cosmos (partition key)
  const db = await connectCosmos();
  const me = await db.sessions.get();
  if(!me || !me.username) return unauthorized();
  const vote = await db.votes.getByUser(me.username);
  return ok({ vote: vote || null });
}
