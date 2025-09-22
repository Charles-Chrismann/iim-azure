// Simple in-browser invoker to call serverless handlers by name

const modules = {
  'register': () => import('./register.js'),
  'login': () => import('./login.js'),
  'logout': () => import('./logout.js'),
  'me': () => import('./me.js'),
  'vote': () => import('./vote.js'),
  'my-vote': () => import('./my-vote.js'),
  'results': () => import('./results.js'),
};

export async function invoke(name, { method = 'GET', body } = {}){
  const load = modules[name];
  if(!load) throw new Error(`Unknown function: ${name}`);
  const mod = await load();
  const event = { httpMethod: method.toUpperCase(), body: body ? JSON.stringify(body) : undefined };
  const res = await mod.handler(event);
  const parsed = { ...res, data: safeParse(res.body) };
  return parsed;
}

function safeParse(s){ try{return s ? JSON.parse(s): null;}catch{return null;} }

