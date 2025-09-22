import { delay, ok } from './_lib/utils.js';
import { connectCosmos } from './_lib/cosmos.js';

export async function handler(){
  await delay();
  // In production: run an aggregate query against the votes container
  const db = await connectCosmos();
  const summary = await db.votes.summary();
  return ok(summary);
}
