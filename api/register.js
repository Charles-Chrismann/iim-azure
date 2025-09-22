import { delay, ok, badRequest, conflict, sanitizeUser, assertNonEmpty } from './_lib/utils.js';
import { connectCosmos } from './_lib/cosmos.js';

export async function handler(event){
  await delay();
  if((event?.httpMethod || 'GET') !== 'POST') return badRequest('POST required');
  let { username, password } = parse(event);
  try{
    username = sanitizeUser(username);
    assertNonEmpty(username, 'Username required');
    assertNonEmpty(password, 'Password required');
    // Simulate connecting to Cosmos DB and writing a user document
    // In production: await client.database('bayroumeter').container('users').items.create({ id: username, password })
    const db = await connectCosmos();
    const exists = await db.users.get(username);
    if(exists) return conflict('Username already exists');
    await db.users.create({ id: username, password });
    await db.sessions.set(username);
    return ok({ username });
  }catch(e){
    return badRequest(e.message || 'Invalid input');
  }
}

function parse(event){ try{ return event?.body ? JSON.parse(event.body) : {}; }catch{ return {}; } }
