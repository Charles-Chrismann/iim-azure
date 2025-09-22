import { delay, ok, noContent } from './_lib/utils.js';
import { connectCosmos } from './_lib/cosmos.js';

export async function handler(){
  await delay();
  // In production: derive from auth context (cookie/JWT)
  const db = await connectCosmos();
  const me = await db.sessions.get();
  if(me && me.username) return ok({ username: me.username });
  return noContent();
}
