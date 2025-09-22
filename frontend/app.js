// bayroumeter - vanilla JS app with a API over localStorage

(function(){
  const LATENCY_MIN = 350;  // ms
  const LATENCY_JITTER = 400; // ms

  const KEYS = {
    users: 'bm_users',      // { [username]: { password: string, createdAt: number } }
    votes: 'bm_votes',      // { [username]: 'yes' | 'no' }
    session: 'bm_session',  // { username: string, token: string, ts: number }
  };

  // --- API (uses localStorage with small timeouts) ---
  const api = {
    async register(username, password){
      return delay(() => {
        username = sanitizeUser(username);
        assertNonEmpty(username, 'Username required');
        assertNonEmpty(password, 'Password required');

        const users = load(KEYS.users, {});
        if(users[username]) throw apiError('Username already exists');
        users[username] = { password, createdAt: Date.now() };
        save(KEYS.users, users);
        // auto-login after register
        const session = { username, token: makeToken(), ts: Date.now() };
        save(KEYS.session, session);
        return { ok: true, username };
      });
    },

    async login(username, password){
      return delay(() => {
        username = sanitizeUser(username);
        const users = load(KEYS.users, {});
        const user = users[username];
        if(!user || user.password !== password) throw apiError('Invalid credentials');
        const session = { username, token: makeToken(), ts: Date.now() };
        save(KEYS.session, session);
        return { ok: true, username };
      });
    },

    async logout(){
      return delay(() => {
        localStorage.removeItem(KEYS.session);
        return { ok: true };
      });
    },

    async me(){
      return delay(() => load(KEYS.session, null));
    },

    async submitVote(choice){
      return delay(() => {
        const session = load(KEYS.session, null);
        if(!session) throw apiError('Not authenticated');
        const votes = load(KEYS.votes, {});
        const normalized = normalizeChoice(choice);
        votes[session.username] = normalized;
        save(KEYS.votes, votes);
        return summarize(votes);
      });
    },

    async myVote(){
      return delay(() => {
        const session = load(KEYS.session, null);
        if(!session) throw apiError('Not authenticated');
        const votes = load(KEYS.votes, {});
        return votes[session.username] || null;
      });
    },

    async results(){
      return delay(() => summarize(load(KEYS.votes, {})));
    }
  };

  // --- Helpers ---
  function delay(fn){
    const ms = LATENCY_MIN + Math.floor(Math.random() * LATENCY_JITTER);
    return new Promise((resolve, reject) => setTimeout(() => {
      try { resolve(fn()); } catch (e) { reject(e); }
    }, ms));
  }
  function load(key, fallback){
    try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch { return fallback; }
  }
  function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function makeToken(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }
  function apiError(message){ const e = new Error(message); e.isApi = true; return e; }
  function sanitizeUser(u){ return (u || '').trim().toLowerCase(); }
  function normalizeChoice(c){
    const v = String(c || '').toLowerCase();
    if(v !== 'yes' && v !== 'no') throw apiError('Invalid vote');
    return v;
  }
  function assertNonEmpty(x, msg){ if(!x || !String(x).trim()) throw apiError(msg); }
  function summarize(votes){
    const users = Object.keys(votes);
    const yes = users.filter(u => votes[u] === 'yes').length;
    const no = users.filter(u => votes[u] === 'no').length;
    const total = yes + no;
    const pct = (n) => total ? Math.round((n/total)*100) : 0;
    return { total, yes, no, pctYes: pct(yes), pctNo: pct(no) };
  }

  // --- UI wiring ---
  const els = {
    userLabel: document.getElementById('user-label'),
    logoutBtn: document.getElementById('logout-btn'),
    authView: document.getElementById('auth-view'),
    voteView: document.getElementById('vote-view'),
    resultsView: document.getElementById('results-view'),
    tabLogin: document.getElementById('tab-login'),
    tabRegister: document.getElementById('tab-register'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    loginError: document.getElementById('login-error'),
    registerError: document.getElementById('register-error'),
    voteYes: document.getElementById('vote-yes'),
    voteNo: document.getElementById('vote-no'),
    voteMsg: document.getElementById('vote-message'),
    showResults: document.getElementById('show-results'),
    currentVote: document.getElementById('current-vote'),
    barYes: document.getElementById('bar-yes'),
    barNo: document.getElementById('bar-no'),
    pctYes: document.getElementById('pct-yes'),
    pctNo: document.getElementById('pct-no'),
    totals: document.getElementById('totals'),
  };

  // Tab switching
  els.tabLogin.addEventListener('click', () => setTab('login'));
  els.tabRegister.addEventListener('click', () => setTab('register'));

  function setTab(which){
    const loginActive = which === 'login';
    els.tabLogin.classList.toggle('active', loginActive);
    els.tabRegister.classList.toggle('active', !loginActive);
    els.tabLogin.setAttribute('aria-selected', String(loginActive));
    els.tabRegister.setAttribute('aria-selected', String(!loginActive));
    els.loginForm.classList.toggle('hidden', !loginActive);
    els.registerForm.classList.toggle('hidden', loginActive);
    clearErrors();
  }

  function clearErrors(){
    els.loginError.textContent = '';
    els.registerError.textContent = '';
  }

  // Auth forms
  els.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); clearErrors();
    const fd = new FormData(els.loginForm); // capture before disabling
    const username = fd.get('username');
    const password = fd.get('password');
    setBusy(els.loginForm, true);
    try{
      await api.login(username, password);
      await renderState();
    }catch(err){ els.loginError.textContent = err.message || 'Login failed'; }
    finally{ setBusy(els.loginForm, false); }
  });

  els.registerForm.addEventListener('submit', async (e) => {
    e.preventDefault(); clearErrors();
    const fd = new FormData(els.registerForm); // capture before disabling
    const username = fd.get('username');
    const password = fd.get('password');
    setBusy(els.registerForm, true);
    try{
      await api.register(username, password);
      await renderState();
    }catch(err){ els.registerError.textContent = err.message || 'Registration failed'; }
    finally{ setBusy(els.registerForm, false); }
  });

  // Logout
  els.logoutBtn.addEventListener('click', async () => {
    els.logoutBtn.disabled = true;
    await api.logout();
    els.logoutBtn.disabled = false;
    await renderState();
  });

  // Voting
  els.voteYes.addEventListener('click', () => submitVote('yes'));
  els.voteNo.addEventListener('click', () => submitVote('no'));
  els.showResults.addEventListener('click', async () => {
    await updateResults();
    showView('results');
  });

  async function submitVote(choice){
    setBusy(els.voteView, true);
    els.voteMsg.textContent = '';
    try{
      const res = await api.submitVote(choice);
      els.voteMsg.textContent = `Vote saved: ${choice.toUpperCase()} ✔`;
      await updateMyVote();
      updateResultsUI(res);
    }catch(err){ els.voteMsg.textContent = err.message || 'Could not save vote'; }
    finally{ setBusy(els.voteView, false); }
  }

  function setBusy(container, busy){
    container.querySelectorAll('button,input').forEach(el => el.disabled = !!busy);
  }

  function showView(which){
    const isAuth = which === 'auth';
    const isVote = which === 'vote';
    const isResults = which === 'results';
    els.authView.classList.toggle('hidden', !isAuth);
    els.voteView.classList.toggle('hidden', !isVote);
    els.resultsView.classList.toggle('hidden', !isResults);
  }

  async function updateMyVote(){
    try{
      const v = await api.myVote();
      if(v){
        els.currentVote.textContent = `Your current vote: ${v.toUpperCase()}`;
        els.currentVote.hidden = false;
      } else {
        els.currentVote.hidden = true;
      }
    }catch{ els.currentVote.hidden = true; }
  }

  async function updateResults(){
    const res = await api.results();
    updateResultsUI(res);
  }

  function updateResultsUI(res){
    els.barYes.style.width = res.pctYes + '%';
    els.barNo.style.width = res.pctNo + '%';
    els.pctYes.textContent = res.pctYes + '%';
    els.pctNo.textContent = res.pctNo + '%';
    els.totals.textContent = `${res.total} vote${res.total===1?'':'s'}`;
  }

  async function renderState(){
    // who am I?
    const me = await api.me();
    if(me && me.username){
      els.userLabel.textContent = `Signed in as ${me.username}`;
      els.logoutBtn.hidden = false;
      showView('vote');
      await updateMyVote();
      await updateResults();
    } else {
      els.userLabel.textContent = '';
      els.logoutBtn.hidden = true;
      showView('auth');
      setTab('login');
    }
  }

  // Init
  renderState();
})();
