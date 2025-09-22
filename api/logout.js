import { delay, ok } from './_lib/utils.js';
import { connectCosmos } from './_lib/cosmos.js';

export async function handler(){
  await delay();
  // In production: clear auth cookie or revoke token
  const db = await connectCosmos();
  await db.sessions.clear();
  return ok({ ok: true });
}
