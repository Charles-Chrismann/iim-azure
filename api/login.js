import { delay, ok, badRequest, sanitizeUser, assertNonEmpty } from './_lib/utils.js';
import { connectCosmos } from './_lib/cosmos.js';

export async function handler(event){
  await delay();
  if((event?.httpMethod || 'GET') !== 'POST') return badRequest('POST required');
  let { username, password } = parse(event);
  try{
    username = sanitizeUser(username);
    assertNonEmpty(username, 'Username required');
    assertNonEmpty(password, 'Password required');
    // In production: read user doc from Cosmos and verify password hash
    const db = await connectCosmos();
    const user = await db.users.get(username);
    if(!user || user.password !== password) return badRequest('Invalid credentials');
    await db.sessions.set(username);
    return ok({ username });
  }catch(e){
    return badRequest(e.message || 'Invalid input');
  }
}

function parse(event){ try{ return event?.body ? JSON.parse(event.body) : {}; }catch{ return {}; } }
