// ── PASTE YOUR CLIENT ID HERE ──────────────────────────────
const GOOGLE_CLIENT_ID = '811272573386-2a1kl2p4hsiavf3c8onj19jqovdluaes.apps.googleusercontent.com';
// ──────────────────────────────────────────────────────────

// ── CLOCK ──────────────────────────────────────────────────
function updateClock() {
  const now    = new Date();
  const pad    = n => String(n).padStart(2,'0');
  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('clock-time').textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  document.getElementById('clock-date').textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  const h = now.getHours();
  document.getElementById('clock-greeting').textContent =
    h<12 ? 'Good morning, Lalit ☀️' : h<17 ? 'Good afternoon, Lalit 🌤️' : h<21 ? 'Good evening, Lalit 🌆' : 'Good night, Lalit 🌙';
}
updateClock();
setInterval(updateClock, 1000);


// ── WEATHER ────────────────────────────────────────────────
function wInfo(c) {
  const i={0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌧️',61:'🌧️',63:'🌧️',65:'🌧️',71:'🌨️',73:'❄️',75:'❄️',80:'🌦️',81:'🌧️',95:'⛈️',99:'⛈️'};
  const d={0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',48:'Icy fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',71:'Light snow',73:'Snow',75:'Heavy snow',80:'Rain showers',81:'Heavy showers',95:'Thunderstorm',99:'Severe thunderstorm'};
  return {icon:i[c]||'🌡️', desc:d[c]||'Unknown'};
}
// ── WEATHER ────────────────────────────────────────────────
let weatherCity = localStorage.getItem('dash-city') || 'London';
let weatherLat  = parseFloat(localStorage.getItem('dash-lat') || '51.5074');
let weatherLon  = parseFloat(localStorage.getItem('dash-lon') || '-0.1278');

async function changeWeatherCity() {
  const input = document.getElementById('weather-city-input').value.trim();
  if (!input) return;
  const el = document.getElementById('weather-content');
  el.innerHTML = '<span style="color:var(--muted);font-size:13px">Looking up ' + input + '...</span>';
  try {
    const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(input)}&count=1&language=en&format=json`).then(r=>r.json());
    if (!geo.results?.length) { el.innerHTML='<span style="color:var(--muted);font-size:13px">City not found.</span>'; return; }
    const { name, latitude, longitude, country } = geo.results[0];
    weatherCity = name + (country ? ', ' + country : '');
    weatherLat  = latitude;
    weatherLon  = longitude;
    localStorage.setItem('dash-city', weatherCity);
    localStorage.setItem('dash-lat',  weatherLat);
    localStorage.setItem('dash-lon',  weatherLon);
    document.getElementById('weather-label').textContent = 'Weather · ' + weatherCity;
    document.getElementById('weather-city-input').value = weatherCity;
    fetchWeather();
  } catch(e) {
    el.innerHTML = '<span style="color:var(--muted);font-size:13px">Could not look up city.</span>';
  }
}

let forecastData = null; // global store for click-detail
async function fetchWeather() {
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${weatherLat}&longitude=${weatherLon}&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,relativehumidity_2m&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,uv_index_max&temperature_unit=celsius&windspeed_unit=mph&timezone=auto&forecast_days=6`);
    const data = await r.json();
    const c  = data.current;
    const d  = data.daily;
    const w  = wInfo(c.weathercode);
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    // Store forecast globally for detail popovers
    forecastData = d;

    // Build forecast cards — skip index 0 (today already shown)
    const forecastHtml = d.time.slice(1).map((dateStr, i) => {
      const idx  = i + 1;
      const dow  = days[new Date(dateStr).getDay()];
      const fullDate = new Date(dateStr).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'});
      const fw   = wInfo(d.weathercode[idx]);
      // Extra fields if available
      const precip   = d.precipitation_sum        ? Math.round(d.precipitation_sum[idx]*10)/10 + ' mm' : null;
      const wind     = d.windspeed_10m_max         ? Math.round(d.windspeed_10m_max[idx]) + ' mph'     : null;
      const uv       = d.uv_index_max             ? d.uv_index_max[idx]                               : null;
      return `
        <div class="forecast-day" onclick="toggleForecastPopover(this, ${idx})">
          <div class="forecast-day-name">${dow}</div>
          <div class="forecast-day-icon">${fw.icon}</div>
          <div class="forecast-day-temps">${Math.round(d.temperature_2m_max[idx])}°</div>
          <div class="forecast-day-lo">${Math.round(d.temperature_2m_min[idx])}°</div>
          <div class="forecast-popover">
            <div class="fp-title">${fullDate}</div>
            <div class="fp-row"><span class="fp-label">High</span><span class="fp-value">${Math.round(d.temperature_2m_max[idx])}°C</span></div>
            <div class="fp-row"><span class="fp-label">Low</span><span class="fp-value">${Math.round(d.temperature_2m_min[idx])}°C</span></div>
            ${precip!==null?`<div class="fp-row"><span class="fp-label">Rain</span><span class="fp-value">${precip}</span></div>`:''}
            ${wind!==null?`<div class="fp-row"><span class="fp-label">Wind</span><span class="fp-value">${wind}</span></div>`:''}
            ${uv!==null?`<div class="fp-row"><span class="fp-label">UV Index</span><span class="fp-value">${uv}</span></div>`:''}
            <div class="fp-desc">${fw.desc}</div>
          </div>
        </div>`;
    }).join('');

    document.getElementById('weather-label').textContent = 'Weather · ' + weatherCity;
    document.getElementById('weather-content').innerHTML = `
      <div class="weather-main">
        <div class="weather-icon">${w.icon}</div>
        <div>
          <div class="weather-temp">${Math.round(c.temperature_2m)}°C</div>
          <div class="weather-desc">${w.desc}</div>
        </div>
      </div>
      <div class="weather-pills">
        <div class="weather-pill"><strong>${Math.round(c.apparent_temperature)}°C</strong>Feels like</div>
        <div class="weather-pill"><strong>${c.relativehumidity_2m}%</strong>Humidity</div>
        <div class="weather-pill"><strong>${Math.round(c.windspeed_10m)} mph</strong>Wind</div>
      </div>
      <div class="weather-forecast">${forecastHtml}</div>`;
  } catch(e) {
    document.getElementById('weather-content').innerHTML='<span style="color:var(--muted);font-size:13px">Could not load weather.</span>';
  }
}
setInterval(fetchWeather, 10*60*1000);

// Initialize weather on page load
document.getElementById('weather-city-input').value = weatherCity;
document.getElementById('weather-label').textContent = 'Weather · ' + weatherCity;
fetchWeather();

// ── GOOGLE AUTH ────────────────────────────────────────────
let googleToken = null;

async function startGoogleAuth() {
  if (GOOGLE_CLIENT_ID === 'YOUR_CLIENT_ID_HERE') {
    alert('Paste your Google Client ID into the code first (line 3 of the script section).');
    return;
  }
  if (!window.google) {
    await new Promise(resolve => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.onload = resolve;
      document.head.appendChild(s);
    });
  }
  google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/calendar.readonly'
    ].join(' '),
    callback: tok => {
      if (tok.error) return;
      googleToken = tok.access_token;
      // Show connected state for both cards
      ['gmail-setup','gcal-setup'].forEach(id => document.getElementById(id).style.display='none');
      document.getElementById('gmail-connected').style.display='flex';
      document.getElementById('gcal-connected').style.display='flex';
      fetchGmail();
      fetchCalendar();
      fetchCalendarReminders();
    }
  }).requestAccessToken();
}


// ── EMAIL CATEGORISATION ───────────────────────────────────
// Looks at sender domain + keywords to assign a category
function categoriseEmail(from, subject) {
  const f = (from + ' ' + subject).toLowerCase();

  // Finance / bills
  if (/bank|paypal|invoice|payment|statement|barclays|hsbc|lloyds|natwest|monzo|revolut|starling|bill|receipt|transaction|finance|tax|hmrc|pension|invest/.test(f))
    return 'finance';

  // Shopping / orders
  if (/amazon|ebay|etsy|order|delivery|dispatch|shipped|tracking|argos|asos|next|john lewis|tesco|sainsbury|waitrose|boots|shop|store|purchase/.test(f))
    return 'shopping';

  // Social
  if (/facebook|instagram|twitter|linkedin|reddit|tiktok|youtube|notification|comment|like|follow|mention|whatsapp|messenger|discord|slack|teams/.test(f))
    return 'social';

  // Work — common work signals
  if (/meeting|calendar invite|agenda|report|project|deadline|task|jira|confluence|notion|github|gitlab|bitbucket|ci\/cd|pull request|review|standup|sprint/.test(f))
    return 'work';

  return 'other';
}

const categoryLabels = { work:'Work', social:'Social', shopping:'Shopping', finance:'Finance', other:'Other' };


// ── GMAIL ──────────────────────────────────────────────────
let gmailNextPageToken = null;
let activeEmailTab = 'all';
let allEmails = []; // cache all fetched email metadata

const catColors = { work:'var(--work)', social:'var(--social)', shopping:'var(--shopping)', finance:'var(--finance)', other:'var(--muted)' };
const catBg     = { work:'rgba(91,141,238,0.15)', social:'rgba(168,85,247,0.15)', shopping:'rgba(249,115,22,0.15)', finance:'rgba(34,197,94,0.15)', other:'rgba(85,85,106,0.15)' };
const catFg     = { work:'#88aaff', social:'#c084fc', shopping:'#fb923c', finance:'#4ade80', other:'#a0a0b8' };

function setEmailTab(cat) {
  activeEmailTab = cat;
  document.querySelectorAll('.email-tab').forEach(b => {
    b.classList.toggle('active', b.classList.contains('tab-' + cat));
  });
  renderEmailList();
}

function updateTabCounts() {
  const counts = { all: allEmails.length, work:0, social:0, shopping:0, finance:0, other:0 };
  allEmails.forEach(e => { if (counts[e._cat] !== undefined) counts[e._cat]++; });
  Object.keys(counts).forEach(k => {
    const el = document.getElementById('tc-' + k);
    if (el) el.textContent = counts[k];
  });
  // Update unread badge on card label
  const unreadCount = allEmails.filter(e => e._unread).length;
  const badge = document.getElementById('unread-badge');
  if (badge) {
    badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
    badge.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
  }
}

function renderEmailList() {
  const el = document.getElementById('gmail-emails');
  const visible = activeEmailTab === 'all' ? allEmails : allEmails.filter(e => e._cat === activeEmailTab);

  if (!visible.length) {
    el.innerHTML = '<div class="list-empty">No emails in this category</div>';
    return;
  }

  el.innerHTML = visible.map((e, vi) => {
    const cat = e._cat;
    return `
      <div class="email-item cat-${cat} ${e._unread?'unread':''}" style="cursor:pointer" onclick="openEmail('${e._id}', this)">
        <div class="email-cat-dot"></div>
        <div class="email-unread-dot"></div>
        <div class="email-body">
          <div class="email-sender">${escapeHtml(e._name)}</div>
          <div class="email-subject">${escapeHtml(e._subject)}</div>
        </div>
        <div class="email-meta">
          <div class="email-time">${e._time}</div>
          <span class="email-badge" style="background:${catBg[cat]};color:${catFg[cat]}">${categoryLabels[cat]}</span>
        </div>
      </div>`;
  }).join('');

  // Re-add Load More if there is one
  if (gmailNextPageToken && activeEmailTab === 'all') {
    el.insertAdjacentHTML('beforeend', `
      <button id="gmail-load-more" class="btn" style="margin-top:6px;width:100%;font-size:12px;padding:8px;"
        onclick="fetchGmail(gmailNextPageToken)">Load more emails</button>`);
  }
}

function parseEmailMeta(e) {
  const h       = e.payload.headers;
  const from    = h.find(x=>x.name==='From')?.value || '';
  const subject = h.find(x=>x.name==='Subject')?.value || '(no subject)';
  const date    = h.find(x=>x.name==='Date')?.value || '';
  const unread  = e.labelIds?.includes('UNREAD');
  const name    = from.replace(/<[^>]+>/,'').replace(/"/g,'').trim() || from.split('@')[0];
  const cat     = categoriseEmail(from, subject);
  const d       = new Date(date);
  const now     = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time    = isNaN(d) ? '' : isToday
    ? d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})
    : d.toLocaleDateString('en-GB',{day:'numeric',month:'short'});
  return { _id:e.id, _from:from, _name:name, _subject:subject, _date:date, _unread:unread, _cat:cat, _time:time };
}

async function fetchGmail(pageToken = null) {
  if (!googleToken) return;
  const el = document.getElementById('gmail-emails');
  if (!pageToken) {
    gmailNextPageToken = null;
    allEmails = [];
    el.innerHTML = '<div class="list-empty">Loading emails…</div>';
  } else {
    const btn = document.getElementById('gmail-load-more');
    if (btn) btn.remove();
  }
  try {
    let url = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&labelIds=INBOX';
    if (pageToken) url += `&pageToken=${pageToken}`;
    const list = await fetch(url, { headers: { Authorization: `Bearer ${googleToken}` } }).then(r=>r.json());

    if (list.error) throw new Error(list.error.message || JSON.stringify(list.error));
    if (!list.messages) { el.innerHTML='<div class="list-empty">Inbox is empty.</div>'; return; }

    gmailNextPageToken = list.nextPageToken || null;

    // Fetch details in batches of 10
    const fetched = [];
    for (let i = 0; i < list.messages.length; i += 10) {
      const batch = list.messages.slice(i, i + 10);
      const results = await Promise.all(batch.map(m =>
        fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${googleToken}` } }
        ).then(r=>r.json())
      ));
      fetched.push(...results);
    }

    allEmails.push(...fetched.map(parseEmailMeta));
    updateTabCounts();
    renderEmailList();
  } catch(err) {
    el.innerHTML = `<div class="list-empty">Could not load emails.<br><span style="font-size:11px;color:var(--muted)">${err.message||err}</span></div>`;
    console.error('Gmail fetch error:', err);
  }
}

// ── EMAIL MODAL ────────────────────────────────────────────
async function openEmail(id, rowEl) {
  const backdrop = document.getElementById('email-modal-backdrop');
  backdrop.classList.add('open');
  document.getElementById('modal-body').innerHTML = '<div class="modal-loading">Loading email…</div>';

  // Fill header from cached meta
  const meta = allEmails.find(e => e._id === id);
  if (meta) {
    document.getElementById('modal-subject').textContent = meta._subject;
    document.getElementById('modal-from').innerHTML = `<strong>${escapeHtml(meta._name)}</strong> &lt;${escapeHtml(meta._from)}&gt;`;
    document.getElementById('modal-date').textContent = meta._date ? new Date(meta._date).toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '';
    const badge = document.getElementById('modal-badge');
    badge.textContent = categoryLabels[meta._cat];
    badge.style.background = catBg[meta._cat];
    badge.style.color = catFg[meta._cat];
  }

  try {
    const data = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
      { headers: { Authorization: `Bearer ${googleToken}` } }
    ).then(r=>r.json());

    const body = extractEmailBody(data.payload);
    if (body) {
      document.getElementById('modal-body').innerHTML = body;
    } else {
      // Last resort: show raw snippet
      const snippet = data.snippet ? `<p style="color:var(--text2);font-size:13px">${escapeHtml(data.snippet)}</p>` : '';
      document.getElementById('modal-body').innerHTML = snippet || '<em style="color:var(--muted)">No readable content found.</em>';
    }
  } catch(err) {
    document.getElementById('modal-body').innerHTML = `<div style="color:var(--muted)">Could not load email body: ${err.message}</div>`;
  }
}

function extractEmailBody(payload) {
  // Recursively search parts for a given mime type
  function findPart(p, mime) {
    if (p.mimeType === mime && p.body?.data) return p.body.data;
    if (p.parts) { for (const sub of p.parts) { const r = findPart(sub, mime); if (r) return r; } }
    return null;
  }
  // Gmail uses URL-safe base64
  const decode = b64 => {
    try {
      const fixed = b64.replace(/-/g, '+').replace(/_/g, '/');
      const bin   = atob(fixed);
      const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
      return new TextDecoder('utf-8').decode(bytes);
    } catch(e) { console.error('decode error', e); return ''; }
  };

  const htmlB64 = findPart(payload, 'text/html');
  if (htmlB64) {
    const src = decode(htmlB64);
    // Use a blob URL so the iframe gets a real document context
    const blob = new Blob([src], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    return `<iframe src="${url}" style="width:100%;height:500px;border:none;border-radius:6px;background:#fff;" sandbox="allow-same-origin allow-popups"></iframe>`;
  }
  const txtB64 = findPart(payload, 'text/plain');
  if (txtB64) {
    const txt = decode(txtB64);
    return `<pre style="white-space:pre-wrap;word-break:break-word;font-family:var(--fb);font-size:13px;color:var(--text2);line-height:1.7">${escapeHtml(txt)}</pre>`;
  }
  return null;
}

function closeEmailModal(e) {
  if (e && e.target !== document.getElementById('email-modal-backdrop')) return;
  document.getElementById('email-modal-backdrop').classList.remove('open');
  document.getElementById('modal-body').innerHTML = '';
}
document.addEventListener('keydown', e => { if(e.key==='Escape') { closeEmailModal(); closeWidget(); } });


// ── GOOGLE CALENDAR ────────────────────────────────────────
async function fetchCalendar() {
  if (!googleToken) return;
  const el = document.getElementById('gcal-events');
  el.innerHTML = '<div class="list-empty">Loading events...</div>';
  try {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1).toISOString();

    const data = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${start}&timeMax=${end}&singleEvents=true&orderBy=startTime`,
      { headers: { Authorization: `Bearer ${googleToken}` } }
    ).then(r=>r.json());

    if (!data.items?.length) {
      el.innerHTML = '<div class="list-empty">No events today 🎉</div>';
      return;
    }

    el.innerHTML = data.items.map(e => {
      const isAllDay = !e.start.dateTime;
      const start    = isAllDay ? null : new Date(e.start.dateTime);
      const end      = isAllDay ? null : new Date(e.end?.dateTime || e.start.dateTime);
      const timeStr  = start ? start.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) : 'All day';
      const ampm     = start ? (start.getHours()>=12?'PM':'AM') : '';

      // Duration string
      let duration = '';
      if (start && end) {
        const mins = Math.round((end - start) / 60000);
        duration = mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h${mins%60?` ${mins%60}m`:''}`;
      }

      return `
        <div class="cal-item ${isAllDay?'all-day':''}">
          <div class="cal-time-col">
            <div class="cal-time">${timeStr}</div>
            <div class="cal-ampm">${ampm}</div>
          </div>
          <div class="cal-divider"></div>
          <div class="cal-info">
            <div class="cal-title">${escapeHtml(e.summary||'Untitled')}</div>
            ${e.location ? `<div class="cal-loc">📍 ${escapeHtml(e.location)}</div>` : ''}
            ${duration ? `<div class="cal-loc">⏱ ${duration}</div>` : ''}
          </div>
        </div>`;
    }).join('');
  } catch(err) {
    el.innerHTML = '<div class="list-empty">Could not load calendar.</div>';
    console.error(err);
  }
}

// Refresh every 5 minutes when connected
setInterval(() => { if(googleToken) { fetchGmail(); fetchCalendar(); fetchCalendarReminders(); } }, 5*60*1000);


// ── TO-DO ──────────────────────────────────────────────────
let todos = JSON.parse(localStorage.getItem('dash-todos')||'[]');
const saveTodos = () => localStorage.setItem('dash-todos', JSON.stringify(todos));

// Migrate existing todos: add priority + due if missing
todos.forEach(t => {
  if (!t.priority) t.priority = 'medium';
  if (t.due === undefined) t.due = null;
});
saveTodos();

function renderTodos() {
  const el = document.getElementById('todo-list');
  if (!todos.length) { el.innerHTML='<div class="list-empty">No tasks yet</div>'; return; }

  // Sort: done last, then overdue first, then high priority first, then by due date
  const priorityWeight = { high: 0, medium: 1, low: 2 };
  const now = new Date(); now.setHours(0,0,0,0);
  const sorted = todos.map((t, i) => ({ ...t, _idx: i }));
  sorted.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const aOverdue = a.due && new Date(a.due) < now && !a.done;
    const bOverdue = b.due && new Date(b.due) < now && !b.done;
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    const pa = priorityWeight[a.priority] ?? 1, pb = priorityWeight[b.priority] ?? 1;
    if (pa !== pb) return pa - pb;
    if (a.due && b.due) return new Date(a.due) - new Date(b.due);
    if (a.due) return -1;
    if (b.due) return 1;
    return 0;
  });

  el.innerHTML = sorted.map(t => {
    const isOverdue = t.due && new Date(t.due) < now && !t.done;
    const dueBadge = t.due ? `<span class="todo-due-badge ${isOverdue?'overdue':''}">${isOverdue?'Overdue · ':''}${new Date(t.due).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</span>` : '';
    return `
    <div class="todo-item ${t.done?'done':''}">
      <input type="checkbox" ${t.done?'checked':''} onchange="toggleTodo(${t._idx})"/>
      <span class="priority-dot p-${t.priority||'medium'}"></span>
      <span class="todo-text">${escapeHtml(t.text)}</span>
      ${dueBadge}
      <button class="btn-x" onclick="deleteTodo(${t._idx})">×</button>
    </div>`;
  }).join('');
}

function addTodo() {
  const el = document.getElementById('todo-input');
  const v  = el.value.trim();
  if (!v) return;
  const priority = document.getElementById('todo-priority').value;
  const due = document.getElementById('todo-due').value || null;
  todos.unshift({text:v, done:false, priority: priority, due: due});
  saveTodos(); renderTodos();
  el.value=''; el.focus();
  document.getElementById('todo-due').value = '';
}
function toggleTodo(i) { todos[i].done=!todos[i].done; saveTodos(); renderTodos(); }
function deleteTodo(i) { todos.splice(i,1); saveTodos(); renderTodos(); }
document.getElementById('todo-input').addEventListener('keydown', e => { if(e.key==='Enter') addTodo(); });
renderTodos();


// ── REMINDERS ─────────────────────────────────────────────
let reminders = JSON.parse(localStorage.getItem('dash-reminders')||'[]');
let calendarReminders = []; // populated from Google Calendar
const saveReminders = () => localStorage.setItem('dash-reminders', JSON.stringify(reminders));
const isToday = ds => { const d=new Date(ds),n=new Date(); return d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate(); };
const fmtDate = ds => {
  const d = new Date(ds);
  // all-day events stored as date strings like "2025-07-04"
  if (ds.length === 10) return d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}) + ' · All day';
  return d.toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
};

function renderReminders() {
  const el = document.getElementById('reminder-list');

  // Merge manual reminders + calendar events into one sorted list
  const all = [
    ...reminders.map((r, i) => ({ ...r, _type: 'manual', _idx: i })),
    ...calendarReminders.map(r => ({ ...r, _type: 'cal' }))
  ].sort((a, b) => {
    const da = new Date(a.date), db = new Date(b.date);
    if (isToday(a.date) !== isToday(b.date)) return isToday(a.date) ? -1 : 1;
    return da - db;
  });

  if (!all.length) { el.innerHTML='<div class="list-empty">No reminders yet</div>'; return; }

  el.innerHTML = all.map(r => {
    const today = isToday(r.date);
    const isCal = r._type === 'cal';
    const deleteBtn = isCal ? '' : `<button class="btn-x" onclick="deleteReminder(${r._idx})">×</button>`;
    const calIcon   = isCal ? `<span style="font-size:13px;flex-shrink:0" title="From Google Calendar">📅</span>` : '';
    return `
      <div class="reminder-item ${today?'today':''}">
        <div class="r-dot"></div>
        ${calIcon}
        <div class="r-info">
          <div class="r-title">${escapeHtml(r.title)}</div>
          <div class="r-date">${fmtDate(r.date)}</div>
        </div>
        ${today?'<span class="r-badge">TODAY</span>':''}
        ${deleteBtn}
      </div>`;
  }).join('');
}

async function fetchCalendarReminders() {
  if (!googleToken) return;
  try {
    const now  = new Date();
    const end  = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // next 7 days
    const data = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=50`,
      { headers: { Authorization: `Bearer ${googleToken}` } }
    ).then(r=>r.json());

    if (!data.items?.length) { calendarReminders = []; renderReminders(); return; }

    calendarReminders = data.items.map(e => ({
      title: e.summary || 'Untitled event',
      // all-day events use e.start.date; timed events use e.start.dateTime
      date: e.start.dateTime || e.start.date,
      _type: 'cal'
    }));
    renderReminders();
  } catch(err) {
    console.error('Calendar reminders error:', err);
  }
}

function addReminder() {
  const t=document.getElementById('r-title').value.trim();
  const d=document.getElementById('r-date').value;
  if(!t||!d){alert('Please fill in both fields.');return;}
  reminders.push({title:t,date:d});
  saveReminders(); renderReminders();
  document.getElementById('r-title').value='';
  document.getElementById('r-date').value='';
}
function deleteReminder(i) { reminders.splice(i,1); saveReminders(); renderReminders(); }
renderReminders();


// ── DAILY QUOTE ────────────────────────────────────────────
async function fetchQuote() {
  const cached = JSON.parse(localStorage.getItem('dash-quote')||'null');
  const today  = new Date().toDateString();
  if (cached?.date===today) { showQuote(cached.q,cached.a); return; }
  try {
    const data = await fetch('https://api.allorigins.win/raw?url='+encodeURIComponent('https://zenquotes.io/api/random')).then(r=>r.json());
    localStorage.setItem('dash-quote',JSON.stringify({date:today,q:data[0].q,a:data[0].a}));
    showQuote(data[0].q,data[0].a);
  } catch(e) { showQuote('The secret of getting ahead is getting started.','Mark Twain'); }
}
function showQuote(q,a) {
  const qt = document.getElementById('clock-quote-text');
  const qa = document.getElementById('clock-quote-author');
  if (qt) qt.textContent = q;
  if (qa) { qa.textContent = a; qa.style.display = 'block'; }
}
fetchQuote();



// ── WIDGET EXPAND ──────────────────────────────────────────
const widgetContents = {
  clock: {
    title: 'Time & Quote',
    get: () => {
      const c = document.querySelector('.c-clock');
      return Array.from(c.children).slice(1).map(e=>e.outerHTML).join('');
    }
  },
  weather: {
    title: 'Weather · London',
    get: () => document.getElementById('weather-content').outerHTML
  },
  gmail: {
    title: 'Gmail — Inbox',
    get: () => document.getElementById('gmail-connected').innerHTML ||
               document.getElementById('gmail-setup').outerHTML
  },
  calendar: {
    title: 'Google Calendar — Today',
    get: () => document.getElementById('gcal-connected').innerHTML ||
               document.getElementById('gcal-setup').outerHTML
  },
  todo: {
    title: 'To-Do',
    get: () => {
      const c = document.querySelector('.c-todo');
      return Array.from(c.children).slice(1).map(e=>e.outerHTML).join('');
    }
  },
  reminder: {
    title: 'Reminders',
    get: () => {
      const c = document.querySelector('.c-reminder');
      return Array.from(c.children).slice(1).map(e=>e.outerHTML).join('');
    }
  },
  notes: {
    title: 'Notes',
    get: () => {
      const c = document.querySelector('.c-notes');
      return Array.from(c.children).slice(1).map(e=>e.outerHTML).join('');
    },
    afterMount: () => {
      const body = document.getElementById('widget-expanded-body');
      const area = body.querySelector('#notes-area');
      if (area) area.addEventListener('input', updateNote);
      const titleInput = body.querySelector('#note-title-input');
      if (titleInput) titleInput.addEventListener('keydown', e => { if (e.key === 'Enter') addNote(); });
    }
  },
  pomodoro: {
    title: 'Pomodoro Timer',
    get: () => {
      const c = document.querySelector('.c-pomodoro');
      return Array.from(c.children).slice(1).map(e=>e.outerHTML).join('');
    }
  },
  news: {
    title: 'News',
    get: () => {
      const c = document.querySelector('.c-news');
      return Array.from(c.children).slice(1).map(e=>e.outerHTML).join('');
    }
  }
};

let expandedWidget = null;

function expandWidget(id) {
  const def = widgetContents[id];
  if (!def) return;
  expandedWidget = id;
  document.getElementById('widget-expanded-title').textContent = def.title;
  document.getElementById('widget-expanded-body').innerHTML = def.get();
  document.getElementById('widget-overlay').classList.add('open');

  // Re-wire todo/reminder interactive elements inside overlay
  const body = document.getElementById('widget-expanded-body');
  const todoInput = body.querySelector('#todo-input');
  if (todoInput) todoInput.addEventListener('keydown', e => { if(e.key==='Enter') addTodo(); });

  // Run afterMount hook if defined
  if (def.afterMount) def.afterMount();
}

function closeWidget(e) {
  if (e && e.target !== document.getElementById('widget-overlay')) return;
  document.getElementById('widget-overlay').classList.remove('open');
  expandedWidget = null;
}

// ── EMAIL MODAL MAXIMISE ───────────────────────────────────
let isMaximised = false;
function toggleMaximise() {
  isMaximised = !isMaximised;
  const modal    = document.getElementById('email-modal');
  const backdrop = document.getElementById('email-modal-backdrop');
  const btn      = document.getElementById('btn-maximise');
  modal.classList.toggle('maximised', isMaximised);
  backdrop.classList.toggle('maximised', isMaximised);
  btn.textContent = isMaximised ? '⤡' : '⤢';
  btn.title = isMaximised ? 'Restore' : 'Maximise';
  // Resize iframe if present
  const iframe = modal.querySelector('iframe');
  if (iframe) iframe.style.height = isMaximised ? 'calc(100vh - 160px)' : '500px';
}


// ── THEME TOGGLE ───────────────────────────────────────────
const savedTheme = localStorage.getItem('dash-theme') || 'dark';
function applyTheme(t) {
  document.body.classList.toggle('light', t === 'light');
  const btn = document.getElementById('theme-toggle');
  btn.innerHTML = t === 'light' ? '🌙 Dark' : '☀️ Light';
  localStorage.setItem('dash-theme', t);
}
function toggleTheme() {
  const cur = document.body.classList.contains('light') ? 'light' : 'dark';
  applyTheme(cur === 'light' ? 'dark' : 'light');
}
applyTheme(savedTheme);


// ── DRAG TO REORDER ────────────────────────────────────────
(function() {
  const grid = document.querySelector('.grid');
  let dragged = null;

  function saveOrder() {
    const order = Array.from(grid.children).map(c => c.className.match(/c-\w+/)?.[0]).filter(Boolean);
    localStorage.setItem('dash-order', JSON.stringify(order));
  }

  function loadOrder() {
    try {
      const order = JSON.parse(localStorage.getItem('dash-order') || 'null');
      if (!order || !Array.isArray(order)) return;
      order.forEach(cls => {
        const el = grid.querySelector('.' + cls);
        if (el) grid.appendChild(el);
      });
    } catch(e) {}
  }

  grid.addEventListener('dragstart', e => {
    const card = e.target.closest('.card');
    if (!card) return;
    dragged = card;
    setTimeout(() => card.classList.add('dragging'), 0);
  });
  grid.addEventListener('dragend', e => {
    const card = e.target.closest('.card');
    if (card) card.classList.remove('dragging');
    document.querySelectorAll('.card.drag-over').forEach(c => c.classList.remove('drag-over'));
    saveOrder();
    dragged = null;
  });
  grid.addEventListener('dragover', e => {
    e.preventDefault();
    const card = e.target.closest('.card');
    if (!card || card === dragged) return;
    document.querySelectorAll('.card.drag-over').forEach(c => c.classList.remove('drag-over'));
    card.classList.add('drag-over');
    // Insert before or after based on mouse position
    const rect   = card.getBoundingClientRect();
    const midX   = rect.left + rect.width / 2;
    const before = e.clientX < midX;
    grid.insertBefore(dragged, before ? card : card.nextSibling);
  });
  grid.addEventListener('dragleave', e => {
    const card = e.target.closest('.card');
    if (card) card.classList.remove('drag-over');
  });
  grid.addEventListener('drop', e => { e.preventDefault(); });

  // Make all cards draggable
  document.querySelectorAll('.card').forEach(c => c.setAttribute('draggable', 'true'));

  // Restore saved order on load
  loadOrder();
})();


// ── GLOBAL SEARCH ──────────────────────────────────────────
let searchDebounce = null;

function onSearchInput(val) {
  const clear = document.getElementById('search-clear');
  const results = document.getElementById('search-results');
  clear.classList.toggle('visible', val.length > 0);
  clearTimeout(searchDebounce);
  if (!val.trim()) { results.classList.remove('open'); return; }
  searchDebounce = setTimeout(() => runSearch(val.trim()), 150);
}

function onSearchKey(e) {
  if (e.key === 'Escape') clearSearch();
}

function clearSearch() {
  document.getElementById('global-search').value = '';
  document.getElementById('search-clear').classList.remove('visible');
  document.getElementById('search-results').classList.remove('open');
}

function highlight(text, query) {
  if (!query) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const re = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')', 'gi');
  return escaped.replace(re, '<mark>$1</mark>');
}

function runSearch(q) {
  const results = document.getElementById('search-results');
  const ql = q.toLowerCase();
  let html = '';

  // Search emails
  const emailMatches = allEmails.filter(e =>
    e._subject.toLowerCase().includes(ql) || e._name.toLowerCase().includes(ql)
  ).slice(0, 5);

  if (emailMatches.length) {
    html += `<div class="search-section-title">Emails</div>`;
    html += emailMatches.map(e => `
      <div class="search-result-item" onclick="openEmail('${e._id}'); clearSearch();">
        <span class="search-result-icon">✉️</span>
        <div class="search-result-text">
          <div class="search-result-title">${highlight(e._subject, q)}</div>
          <div class="search-result-sub">${highlight(e._name, q)}</div>
        </div>
      </div>`).join('');
  }

  // Search todos
  const todoMatches = todos.filter(t => t.text.toLowerCase().includes(ql)).slice(0, 5);
  if (todoMatches.length) {
    html += `<div class="search-section-title">To-Do</div>`;
    html += todoMatches.map(t => {
      const pLabel = t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : 'Medium';
      const dueStr = t.due ? ' · Due ' + new Date(t.due).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : '';
      return `
      <div class="search-result-item" onclick="expandWidget('todo'); clearSearch();">
        <span class="search-result-icon">${t.done ? '✅' : '⬜'}</span>
        <div class="search-result-text">
          <div class="search-result-title">${highlight(t.text, q)}</div>
          <div class="search-result-sub">${pLabel} priority${dueStr}</div>
        </div>
      </div>`;
    }).join('');
  }

  // Search reminders
  const reminderMatches = [...reminders, ...calendarReminders]
    .filter(r => r.title.toLowerCase().includes(ql)).slice(0, 3);
  if (reminderMatches.length) {
    html += `<div class="search-section-title">Reminders</div>`;
    html += reminderMatches.map(r => `
      <div class="search-result-item" onclick="expandWidget('reminder'); clearSearch();">
        <span class="search-result-icon">🔔</span>
        <div class="search-result-text">
          <div class="search-result-title">${highlight(r.title, q)}</div>
          <div class="search-result-sub">${fmtDate(r.date)}</div>
        </div>
      </div>`).join('');
  }

  // Search notes
  const noteMatches = notes.filter(n =>
    n.title.toLowerCase().includes(ql) || (n.body||'').toLowerCase().includes(ql)
  ).slice(0, 5);
  if (noteMatches.length) {
    html += `<div class="search-section-title">Notes</div>`;
    html += noteMatches.map((n, i) => {
      const idx = notes.indexOf(n);
      return `
      <div class="search-result-item" onclick="selectNote(${idx}); expandWidget('notes'); clearSearch();">
        <span class="search-result-icon">📝</span>
        <div class="search-result-text">
          <div class="search-result-title">${highlight(n.title, q)}</div>
          <div class="search-result-sub">${highlight((n.body||'').substring(0,60), q)}</div>
        </div>
      </div>`;
    }).join('');
  }

  // Search news
  if (typeof newsItems !== 'undefined') {
    const newsMatches = newsItems.filter(n =>
      n.title.toLowerCase().includes(ql)
    ).slice(0, 4);
    if (newsMatches.length) {
      html += `<div class="search-section-title">News</div>`;
      html += newsMatches.map(n => `
        <div class="search-result-item" onclick="window.open('${n.link}','_blank'); clearSearch();">
          <span class="search-result-icon">📰</span>
          <div class="search-result-text">
            <div class="search-result-title">${highlight(n.title, q)}</div>
            <div class="search-result-sub">${n.date || ''}</div>
          </div>
        </div>`).join('');
    }
  }

  if (!html) html = `<div class="search-no-results">No results for "${escapeHtml(q)}"</div>`;
  results.innerHTML = html;
  results.classList.add('open');
}

// Close search on outside click
document.addEventListener('click', e => {
  if (!document.getElementById('search-bar-wrap').contains(e.target)) clearSearch();
});


// ── REMINDER NOTIFICATIONS ─────────────────────────────────
const notifiedReminders = new Set(JSON.parse(sessionStorage.getItem('dash-notified') || '[]'));

function saveNotified() {
  sessionStorage.setItem('dash-notified', JSON.stringify([...notifiedReminders]));
}

function showToast(title, timeStr, key) {
  if (notifiedReminders.has(key)) return;
  notifiedReminders.add(key);
  saveNotified();

  const container = document.getElementById('notif-container');
  const toast = document.createElement('div');
  toast.className = 'notif-toast';
  toast.innerHTML = `
    <div class="notif-icon">🔔</div>
    <div class="notif-body">
      <div class="notif-title">${escapeHtml(title)}</div>
      <div class="notif-time">${escapeHtml(timeStr)}</div>
    </div>
    <button class="notif-dismiss" onclick="dismissToast(this.closest('.notif-toast'))">✕</button>
  `;
  toast.addEventListener('click', e => { if (!e.target.closest('.notif-dismiss')) dismissToast(toast); });
  container.appendChild(toast);

  // Also fire browser notification if permitted
  if (Notification.permission === 'granted') {
    new Notification('Reminder: ' + title, { body: timeStr, icon: '' });
  }

  // Auto dismiss after 8 seconds
  setTimeout(() => dismissToast(toast), 8000);
}

function dismissToast(toast) {
  if (!toast || !toast.parentNode) return;
  toast.classList.add('hiding');
  setTimeout(() => toast.remove(), 260);
}

function checkReminderNotifications() {
  const now   = new Date();
  const soon  = new Date(now.getTime() + 15 * 60 * 1000); // 15 min window

  const all = [
    ...reminders.map(r => ({ title: r.title, date: r.date })),
    ...calendarReminders.map(r => ({ title: r.title, date: r.date }))
  ];

  all.forEach(r => {
    const d = new Date(r.date);
    if (isNaN(d)) return;
    const key = r.title + '|' + r.date;
    // Fire if within the next 15 minutes or overdue within the last 2 minutes
    if (d >= new Date(now.getTime() - 2*60*1000) && d <= soon) {
      const diff = Math.round((d - now) / 60000);
      const timeStr = diff <= 0 ? 'Due now!' : `Due in ${diff} minute${diff===1?'':'s'}`;
      showToast(r.title, timeStr, key);
    }
  });
}

// Request browser notification permission once
if (Notification.permission === 'default') {
  Notification.requestPermission();
}

// Check every minute
checkReminderNotifications();
setInterval(checkReminderNotifications, 60 * 1000);


// ── NOTES ─────────────────────────────────────────────────
let notes = JSON.parse(localStorage.getItem('dash-notes-list') || '[]');
let activeNoteIndex = -1;
let noteSaveTimeout;
const saveNotes = () => localStorage.setItem('dash-notes-list', JSON.stringify(notes));

// Migrate old single-note format
(function migrateOldNotes() {
  const old = localStorage.getItem('dash-notes');
  if (old && old.trim()) {
    notes.unshift({ title: 'My Notes', body: old, date: new Date().toISOString() });
    saveNotes();
    localStorage.removeItem('dash-notes');
  } else if (old !== null) {
    localStorage.removeItem('dash-notes');
  }
})();

function renderNotes() {
  const el = document.getElementById('notes-list');
  if (!notes.length) { el.innerHTML = '<div class="list-empty">No notes yet</div>'; return; }
  el.innerHTML = notes.map((n, i) => {
    const d = new Date(n.date);
    const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const preview = (n.body || '').replace(/\n/g, ' ').substring(0, 60);
    return `
      <div class="note-item ${i === activeNoteIndex ? 'active' : ''}" onclick="selectNote(${i})">
        <div class="note-info">
          <div class="note-title">${escapeHtml(n.title)}</div>
          <div class="note-preview">${escapeHtml(preview)}</div>
        </div>
        <div class="note-date">${dateStr}</div>
        <button class="btn-x" onclick="event.stopPropagation(); deleteNote(${i})">×</button>
      </div>`;
  }).join('');
}

function addNote() {
  const titleEl = document.getElementById('note-title-input');
  const area = document.getElementById('notes-area');
  const title = titleEl.value.trim() || 'Untitled';
  const body = area.value.trim();
  notes.unshift({ title: title, body: body, date: new Date().toISOString() });
  saveNotes();
  titleEl.value = '';
  area.value = '';
  activeNoteIndex = 0;
  renderNotes();
  area.focus();
}

function selectNote(i) {
  activeNoteIndex = i;
  const area = document.getElementById('notes-area');
  const titleEl = document.getElementById('note-title-input');
  area.value = notes[i].body || '';
  titleEl.value = notes[i].title || '';
  renderNotes();
  // Refresh markdown preview if in preview mode
  const previewBtn = document.getElementById('notes-preview-btn');
  if (previewBtn && previewBtn.classList.contains('active')) {
    const preview = document.getElementById('notes-preview');
    if (preview && typeof marked !== 'undefined') {
      preview.innerHTML = marked.parse(area.value || '');
    }
  }
  area.focus();
}

function updateNote() {
  if (activeNoteIndex < 0 || activeNoteIndex >= notes.length) return;
  const area = document.getElementById('notes-area');
  const status = document.getElementById('notes-status');
  clearTimeout(noteSaveTimeout);
  status.textContent = '';
  noteSaveTimeout = setTimeout(() => {
    notes[activeNoteIndex].body = area.value;
    saveNotes();
    renderNotes();
    status.textContent = 'Saved';
    setTimeout(() => { status.textContent = ''; }, 2000);
  }, 500);
}

function deleteNote(i) {
  notes.splice(i, 1);
  saveNotes();
  if (activeNoteIndex === i) {
    activeNoteIndex = -1;
    document.getElementById('notes-area').value = '';
    document.getElementById('note-title-input').value = '';
  } else if (activeNoteIndex > i) {
    activeNoteIndex--;
  }
  renderNotes();
}

document.getElementById('notes-area').addEventListener('input', updateNote);
document.getElementById('note-title-input').addEventListener('keydown', e => { if (e.key === 'Enter') addNote(); });
renderNotes();


// ── FORECAST DAY DETAIL ────────────────────────────────────
function toggleForecastPopover(el, idx) {
  const isActive = el.classList.contains('active');
  // Close all open popovers
  document.querySelectorAll('.forecast-day.active').forEach(d => d.classList.remove('active'));
  if (!isActive) el.classList.add('active');
}
// Close popover on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('.forecast-day')) {
    document.querySelectorAll('.forecast-day.active').forEach(d => d.classList.remove('active'));
  }
});


// ── REFRESH FUNCTIONS ──────────────────────────────────────
function refreshGmail() {
  if (!googleToken) return;
  const btn = document.getElementById('gmail-refresh');
  if (btn) btn.classList.add('spinning');

  fetchGmail().finally(() => {
    if (btn) {
      setTimeout(() => btn.classList.remove('spinning'), 300);
    }
  });
}

function refreshCalendar() {
  if (!googleToken) return;
  const btn = document.getElementById('calendar-refresh');
  if (btn) btn.classList.add('spinning');

  Promise.all([
    fetchCalendar(),
    fetchCalendarReminders()
  ]).finally(() => {
    if (btn) {
      setTimeout(() => btn.classList.remove('spinning'), 300);
    }
  });
}

// ── UTILITY ────────────────────────────────────────────────
function escapeHtml(str) {
  const d=document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}


// ── SETTINGS PANEL + CUSTOM BACKGROUNDS ────────────────────
function toggleSettings() {
  const panel = document.getElementById('settings-panel');
  panel.classList.toggle('open');
}
// Close settings on outside click
document.addEventListener('click', e => {
  const panel = document.getElementById('settings-panel');
  const btn = document.getElementById('settings-btn');
  if (panel.classList.contains('open') && !panel.contains(e.target) && !btn.contains(e.target)) {
    panel.classList.remove('open');
  }
});

function applyBgSolid(color) {
  localStorage.setItem('dash-bg', JSON.stringify({ type: 'solid', value: color }));
  applyBackground();
}
function applyBgGradient(str) {
  localStorage.setItem('dash-bg', JSON.stringify({ type: 'gradient', value: str }));
  applyBackground();
}
function applyBgImage() {
  const url = document.getElementById('bg-image-url').value.trim();
  if (!url) return;
  localStorage.setItem('dash-bg', JSON.stringify({ type: 'image', value: url }));
  applyBackground();
}
function resetBg() {
  localStorage.removeItem('dash-bg');
  document.body.style.background = '';
  document.body.style.backgroundImage = '';
  document.body.style.backgroundColor = '';
  applyTheme(localStorage.getItem('dash-theme') || 'dark');
}
function applyBackground() {
  const raw = localStorage.getItem('dash-bg');
  if (!raw) return;
  try {
    const bg = JSON.parse(raw);
    const isLight = document.body.classList.contains('light');
    const overlays = isLight
      ? 'radial-gradient(ellipse 70% 40% at 15% 5%, rgba(91,141,238,0.06) 0%, transparent 60%), radial-gradient(ellipse 50% 30% at 85% 90%, rgba(168,85,247,0.04) 0%, transparent 60%)'
      : 'radial-gradient(ellipse 70% 40% at 15% 5%, rgba(91,141,238,0.07) 0%, transparent 60%), radial-gradient(ellipse 50% 30% at 85% 90%, rgba(168,85,247,0.05) 0%, transparent 60%)';
    if (bg.type === 'solid') {
      document.body.style.backgroundColor = bg.value;
      document.body.style.backgroundImage = overlays;
    } else if (bg.type === 'gradient') {
      document.body.style.backgroundImage = overlays + ', ' + bg.value;
      document.body.style.backgroundColor = '';
    } else if (bg.type === 'image') {
      document.body.style.backgroundImage = overlays + ', url(' + bg.value + ')';
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    }
  } catch(e) {}
}
applyBackground();


// ── IMPORT / EXPORT DATA ───────────────────────────────────
function exportData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('dash-')) {
      data[key] = localStorage.getItem(key);
    }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dashboard-backup-' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!confirm('This will replace all your dashboard data. Continue?')) {
    event.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      // Clear existing dash- keys
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('dash-')) keysToRemove.push(key);
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      // Write imported keys
      Object.keys(data).forEach(k => {
        if (k.startsWith('dash-')) localStorage.setItem(k, data[k]);
      });
      location.reload();
    } catch(err) {
      alert('Invalid backup file.');
    }
  };
  reader.readAsText(file);
}


// ── MARKDOWN NOTES PREVIEW ─────────────────────────────────
if (typeof marked !== 'undefined') {
  marked.setOptions({ breaks: true, gfm: true });
}

function toggleNotesPreview() {
  const btn = document.getElementById('notes-preview-btn');
  const area = document.getElementById('notes-area');
  const preview = document.getElementById('notes-preview');
  const isActive = btn.classList.toggle('active');
  if (isActive) {
    const raw = area.value || '';
    if (typeof marked !== 'undefined') {
      preview.innerHTML = marked.parse(raw);
    } else {
      preview.innerHTML = '<pre>' + escapeHtml(raw) + '</pre>';
    }
    area.style.display = 'none';
    preview.style.display = 'block';
  } else {
    area.style.display = '';
    preview.style.display = 'none';
  }
}


// ── POMODORO FOCUS TIMER ───────────────────────────────────
let pomoState = JSON.parse(localStorage.getItem('dash-pomodoro') || 'null') || {
  workMin: 25, breakMin: 5, sessions: 0, endTime: null, mode: 'work', running: false, pausedRemaining: null
};
let pomoInterval = null;
const savePomoState = () => localStorage.setItem('dash-pomodoro', JSON.stringify(pomoState));

function pomoInit() {
  document.getElementById('pomo-work-min').value = pomoState.workMin;
  document.getElementById('pomo-break-min').value = pomoState.breakMin;
  document.getElementById('pomo-sessions').textContent = 'Sessions: ' + pomoState.sessions;
  document.getElementById('pomo-mode').textContent = pomoState.mode === 'work' ? 'Work' : 'Break';

  if (pomoState.running && pomoState.endTime) {
    const remaining = pomoState.endTime - Date.now();
    if (remaining > 0) {
      pomoStartTicking();
    } else {
      pomoComplete();
    }
  } else if (pomoState.pausedRemaining) {
    pomoUpdateDisplay(pomoState.pausedRemaining);
    document.getElementById('pomo-start').textContent = 'Start';
  } else {
    const mins = pomoState.mode === 'work' ? pomoState.workMin : pomoState.breakMin;
    pomoUpdateDisplay(mins * 60 * 1000);
  }
}

function pomoUpdateDisplay(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  document.getElementById('pomo-display').textContent =
    String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
}

function pomoStartPause() {
  if (pomoState.running) {
    // Pause
    pomoState.running = false;
    pomoState.pausedRemaining = pomoState.endTime - Date.now();
    pomoState.endTime = null;
    clearInterval(pomoInterval);
    pomoInterval = null;
    document.getElementById('pomo-start').textContent = 'Start';
    savePomoState();
  } else {
    // Start / Resume
    if (pomoState.pausedRemaining) {
      pomoState.endTime = Date.now() + pomoState.pausedRemaining;
      pomoState.pausedRemaining = null;
    } else {
      const mins = pomoState.mode === 'work' ? pomoState.workMin : pomoState.breakMin;
      pomoState.endTime = Date.now() + mins * 60 * 1000;
    }
    pomoState.running = true;
    savePomoState();
    pomoStartTicking();
    document.getElementById('pomo-start').textContent = 'Pause';
  }
}

function pomoStartTicking() {
  document.getElementById('pomo-start').textContent = 'Pause';
  clearInterval(pomoInterval);
  pomoInterval = setInterval(pomoTick, 200);
  pomoTick();
}

function pomoTick() {
  if (!pomoState.running || !pomoState.endTime) return;
  const remaining = pomoState.endTime - Date.now();
  if (remaining <= 0) {
    pomoComplete();
  } else {
    pomoUpdateDisplay(remaining);
  }
}

function pomoComplete() {
  clearInterval(pomoInterval);
  pomoInterval = null;
  pomoState.running = false;
  pomoState.endTime = null;
  pomoState.pausedRemaining = null;

  if (pomoState.mode === 'work') {
    pomoState.sessions++;
    pomoState.mode = 'break';
    pomoPlayBeep();
    showToast('Pomodoro Complete!', 'Time for a break. Sessions: ' + pomoState.sessions, 'pomo-' + Date.now());
  } else {
    pomoState.mode = 'work';
    pomoPlayBeep();
    showToast('Break Over!', 'Time to focus. Sessions: ' + pomoState.sessions, 'pomo-' + Date.now());
  }

  document.getElementById('pomo-mode').textContent = pomoState.mode === 'work' ? 'Work' : 'Break';
  document.getElementById('pomo-sessions').textContent = 'Sessions: ' + pomoState.sessions;
  document.getElementById('pomo-start').textContent = 'Start';
  const mins = pomoState.mode === 'work' ? pomoState.workMin : pomoState.breakMin;
  pomoUpdateDisplay(mins * 60 * 1000);
  savePomoState();
}

function pomoReset() {
  clearInterval(pomoInterval);
  pomoInterval = null;
  pomoState.running = false;
  pomoState.endTime = null;
  pomoState.pausedRemaining = null;
  pomoState.mode = 'work';
  pomoState.sessions = 0;
  document.getElementById('pomo-mode').textContent = 'Work';
  document.getElementById('pomo-sessions').textContent = 'Sessions: 0';
  document.getElementById('pomo-start').textContent = 'Start';
  pomoUpdateDisplay(pomoState.workMin * 60 * 1000);
  savePomoState();
}

function pomoUpdateConfig() {
  const w = parseInt(document.getElementById('pomo-work-min').value) || 25;
  const b = parseInt(document.getElementById('pomo-break-min').value) || 5;
  pomoState.workMin = Math.max(1, Math.min(90, w));
  pomoState.breakMin = Math.max(1, Math.min(30, b));
  if (!pomoState.running && !pomoState.pausedRemaining) {
    const mins = pomoState.mode === 'work' ? pomoState.workMin : pomoState.breakMin;
    pomoUpdateDisplay(mins * 60 * 1000);
  }
  savePomoState();
}

function pomoPlayBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1000;
      osc2.type = 'sine';
      gain2.gain.value = 0.3;
      osc2.start();
      osc2.stop(ctx.currentTime + 0.3);
    }, 350);
  } catch(e) {}
}

pomoInit();


// ── NEWS / RSS FEED ────────────────────────────────────────
let newsItems = [];
const defaultRssUrl = 'https://feeds.bbci.co.uk/news/rss.xml';

async function fetchNews() {
  const rssUrl = localStorage.getItem('dash-rss-url') || defaultRssUrl;
  document.getElementById('rss-url-input').value = rssUrl;

  // Check cache
  const cacheRaw = localStorage.getItem('dash-rss-cache');
  if (cacheRaw) {
    try {
      const cache = JSON.parse(cacheRaw);
      if (cache.url === rssUrl && Date.now() - cache.time < 15 * 60 * 1000) {
        newsItems = cache.items;
        renderNews();
        return;
      }
    } catch(e) {}
  }

  try {
    const apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rssUrl);
    const resp = await fetch(apiUrl);
    const data = await resp.json();

    if (data.status !== 'ok' || !data.items) throw new Error(data.message || 'Bad response');

    newsItems = data.items.slice(0, 20).map(item => {
      const title = item.title || 'Untitled';
      const link = item.link || '#';
      let dateStr = '';
      if (item.pubDate) {
        const d = new Date(item.pubDate);
        if (!isNaN(d)) dateStr = d.toLocaleDateString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
      }
      return { title, link, date: dateStr };
    });

    // Cache results
    localStorage.setItem('dash-rss-cache', JSON.stringify({
      url: rssUrl, time: Date.now(), items: newsItems
    }));

    renderNews();
  } catch(e) {
    document.getElementById('news-list').innerHTML = '<div class="list-empty">Could not load news feed.</div>';
    console.error('RSS fetch error:', e);
  }
}

function renderNews() {
  const el = document.getElementById('news-list');
  if (!newsItems.length) { el.innerHTML = '<div class="list-empty">No articles found</div>'; return; }
  el.innerHTML = newsItems.map(n => `
    <a class="news-item" href="${escapeHtml(n.link)}" target="_blank" rel="noopener">
      <div class="news-title">${escapeHtml(n.title)}</div>
      ${n.date ? `<div class="news-date">${n.date}</div>` : ''}
    </a>`).join('');
}

function refreshNews() {
  localStorage.removeItem('dash-rss-cache');
  const btn = document.getElementById('news-refresh');
  if (btn) btn.classList.add('spinning');
  fetchNews().finally(() => {
    if (btn) setTimeout(() => btn.classList.remove('spinning'), 300);
  });
}

function toggleRssConfig() {
  const row = document.getElementById('news-config-row');
  row.style.display = row.style.display === 'none' ? 'flex' : 'none';
}

function saveRssUrl() {
  const url = document.getElementById('rss-url-input').value.trim();
  if (!url) return;
  localStorage.setItem('dash-rss-url', url);
  localStorage.removeItem('dash-rss-cache');
  document.getElementById('news-config-row').style.display = 'none';
  fetchNews();
}

fetchNews();
setInterval(() => { fetchNews(); }, 15 * 60 * 1000);
