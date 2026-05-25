// === Estado ===
const VERSION = 1;
let state = { owned: new Set(), gastos: [] };

// Convierte datos de Firestore/localStorage → state interno
function dataToState(data) {
  return {
    owned: new Set(data.owned || []),
    gastos: data.gastos || [],
  };
}

// Convierte state interno → objeto plano para guardar
function stateToData() {
  return {
    version: VERSION,
    owned: [...state.owned],
    gastos: state.gastos,
  };
}

function saveState() {
  SYNC.save(stateToData());
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

// === Helpers de cálculo ===
function teamOwnedCount(team) {
  let c = 0;
  for (let i = 0; i < 20; i++) {
    if (state.owned.has(String(team.start + i))) c++;
  }
  return c;
}
function groupOwnedCount(g) {
  return g.teams.reduce((s, t) => s + teamOwnedCount(t), 0);
}
function specialsOwnedCount() {
  return ALBUM.specials.reduce((s, x) => s + (state.owned.has(x.id) ? 1 : 0), 0);
}
function totalOwned() {
  let c = specialsOwnedCount();
  ALBUM.groups.forEach(g => c += groupOwnedCount(g));
  return c;
}

// === Render: Topbar global progress ===
function renderGlobalProgress() {
  const total = totalOwned();
  const pct = ((total / 980) * 100).toFixed(1);
  document.getElementById('gp-count').textContent = `${total} / 980`;
  document.getElementById('gp-percent').textContent = `${pct}%`;
  document.getElementById('gp-fill').style.width = pct + '%';
}

// === Render: Resumen ===
function renderResumen() {
  const grid = document.getElementById('resumen-grid');
  grid.innerHTML = '';

  ALBUM.groups.forEach(g => {
    const owned = groupOwnedCount(g);
    const pct = ((owned / 80) * 100).toFixed(1);
    const missing = 80 - owned;
    const countries = g.teams.map(t => t.short).join(' · ');

    const card = document.createElement('div');
    card.className = 'resumen-card';
    card.style.borderLeftColor = g.color;
    card.innerHTML = `
      <div class="resumen-card-header">
        <h3>Grupo ${g.letter}</h3>
        <span class="pct" style="color:${g.color}">${pct}%</span>
      </div>
      <div class="countries">${countries}</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${pct}%;background:${g.color}"></div>
      </div>
      <div class="stats">
        <span>✅ ${owned}/80</span>
        <span class="missing">❌ Faltan ${missing}</span>
      </div>
    `;
    card.addEventListener('click', () => { switchTab('grupos'); renderGroup(g.letter); });
    grid.appendChild(card);
  });

  // Especiales
  const sOwned = specialsOwnedCount();
  const sPct = ((sOwned / 20) * 100).toFixed(1);
  const sCard = document.createElement('div');
  sCard.className = 'resumen-card';
  sCard.style.borderLeftColor = '#fbbf24';
  sCard.innerHTML = `
    <div class="resumen-card-header">
      <h3>⭐ Especiales</h3>
      <span class="pct" style="color:#d97706">${sPct}%</span>
    </div>
    <div class="countries">Panini + FWC 1–19</div>
    <div class="progress-bar">
      <div class="progress-fill" style="width:${sPct}%;background:#fbbf24"></div>
    </div>
    <div class="stats">
      <span>✅ ${sOwned}/20</span>
      <span class="missing">❌ Faltan ${20 - sOwned}</span>
    </div>
  `;
  sCard.addEventListener('click', () => switchTab('especiales'));
  grid.appendChild(sCard);
}

// === Render: Grupos ===
let currentGroup = 'A';

function renderGroupNav() {
  const nav = document.getElementById('group-nav');
  nav.innerHTML = '';
  ALBUM.groups.forEach(g => {
    const btn = document.createElement('button');
    btn.className = 'group-nav-btn' + (g.letter === currentGroup ? ' active' : '');
    btn.textContent = `Grupo ${g.letter}`;
    if (g.letter === currentGroup) {
      btn.style.background = g.color;
      btn.style.borderColor = g.color;
    }
    btn.addEventListener('click', () => renderGroup(g.letter));
    nav.appendChild(btn);
  });
}

function renderGroup(letter) {
  currentGroup = letter;
  renderGroupNav();
  const g = ALBUM.groups.find(x => x.letter === letter);
  const content = document.getElementById('group-content');
  const owned = groupOwnedCount(g);

  content.innerHTML = `
    <div class="group-header">
      <h2 style="background:${g.color}">Grupo ${g.letter}</h2>
      <div class="group-stats">
        <span class="pill owned">✅ ${owned}/80</span>
        <span class="pill missing">❌ Faltan ${80 - owned}</span>
        <span class="pill">${((owned/80)*100).toFixed(1)}%</span>
      </div>
    </div>
    <div class="teams-grid" id="teams-grid-${letter}"></div>
  `;

  const grid = document.getElementById(`teams-grid-${letter}`);
  g.teams.forEach(team => grid.appendChild(renderTeamCard(team, g.color)));
}

function renderTeamCard(team, color) {
  const card = document.createElement('div');
  card.className = 'team-card';
  const ownedCount = teamOwnedCount(team);

  const header = document.createElement('div');
  header.className = 'team-card-header';
  header.style.background = color;
  header.innerHTML = `
    <span><span class="flag">${team.flag}</span> ${team.name}</span>
    <span class="count" data-team-count="${team.start}">${ownedCount}/20</span>
  `;
  card.appendChild(header);

  const list = document.createElement('div');
  list.className = 'sticker-list';
  for (let i = 0; i < 20; i++) {
    const num = team.start + i;
    const id = String(num);
    const isSpecial = (i === 0 || i === 12);
    const isOwned = state.owned.has(id);

    const row = document.createElement('div');
    row.className = 'sticker' + (isOwned ? ' owned' : '') + (isSpecial ? ' special-row' : '');
    row.innerHTML = `
      <span class="num">${num}</span>
      <span class="label">${stickerLabel(team, num)}</span>
      <span class="check"></span>
    `;
    row.addEventListener('click', () => {
      if (state.owned.has(id)) state.owned.delete(id);
      else state.owned.add(id);
      row.classList.toggle('owned');
      header.querySelector('.count').textContent = `${teamOwnedCount(team)}/20`;
      saveState();
      renderGlobalProgress();
    });
    list.appendChild(row);
  }
  card.appendChild(list);
  return card;
}

// === Render: Especiales ===
function renderEspeciales() {
  const grid = document.getElementById('specials-grid');
  grid.innerHTML = '';
  ALBUM.specials.forEach(s => {
    const isOwned = state.owned.has(s.id);
    const card = document.createElement('div');
    card.className = 'special-card' + (isOwned ? ' owned' : '');
    card.innerHTML = `
      <span class="code">${s.label}</span>
      <span class="desc">${s.desc}</span>
      <span class="check"></span>
    `;
    card.addEventListener('click', () => {
      if (state.owned.has(s.id)) state.owned.delete(s.id);
      else state.owned.add(s.id);
      card.classList.toggle('owned');
      saveState();
      renderGlobalProgress();
    });
    grid.appendChild(card);
  });
}

// === Render: Faltantes ===
function renderFaltantes() {
  const container = document.getElementById('faltantes-list');
  container.innerHTML = '';

  const totalMissing = 980 - totalOwned();
  document.getElementById('faltantes-count').textContent = `❌ ${totalMissing} cromos faltan`;

  if (totalMissing === 0) {
    container.innerHTML = '<div class="faltantes-empty">🏆 ¡Álbum completo! Felicidades.</div>';
    return;
  }

  ALBUM.groups.forEach(g => {
    const missing = [];
    g.teams.forEach(team => {
      for (let i = 0; i < 20; i++) {
        const num = team.start + i;
        if (!state.owned.has(String(num))) missing.push({ num, team });
      }
    });
    if (!missing.length) return;

    const block = document.createElement('div');
    block.className = 'faltantes-group';
    block.innerHTML = `
      <div class="faltantes-group-header" style="background:${g.color}">
        Grupo ${g.letter} — ${missing.length} faltantes
      </div>
      <div class="faltantes-items"></div>
    `;
    const items = block.querySelector('.faltantes-items');
    missing.forEach(m => {
      const item = document.createElement('span');
      item.className = 'faltantes-item';
      item.title = `${m.team.name} — ${stickerLabel(m.team, m.num)}`;
      item.textContent = `${m.num} ${m.team.short}`;
      item.addEventListener('click', () => {
        state.owned.add(String(m.num));
        saveState();
        renderAll();
        toast(`Marcado: ${m.num} (${m.team.name})`);
      });
      items.appendChild(item);
    });
    container.appendChild(block);
  });

  const sMissing = ALBUM.specials.filter(s => !state.owned.has(s.id));
  if (sMissing.length) {
    const block = document.createElement('div');
    block.className = 'faltantes-group';
    block.innerHTML = `
      <div class="faltantes-group-header" style="background:#d97706">
        ⭐ Especiales — ${sMissing.length} faltantes
      </div>
      <div class="faltantes-items"></div>
    `;
    const items = block.querySelector('.faltantes-items');
    sMissing.forEach(s => {
      const item = document.createElement('span');
      item.className = 'faltantes-item';
      item.title = s.desc;
      item.textContent = `${s.label} (${s.desc})`;
      item.addEventListener('click', () => {
        state.owned.add(s.id);
        saveState();
        renderAll();
        toast(`Marcado: ${s.label}`);
      });
      items.appendChild(item);
    });
    container.appendChild(block);
  }
}

document.getElementById('copy-faltantes').addEventListener('click', () => {
  const lines = ['Cromos que me faltan — Panini WC 2026:'];
  ALBUM.groups.forEach(g => {
    const miss = [];
    g.teams.forEach(team => {
      for (let i = 0; i < 20; i++) {
        const num = team.start + i;
        if (!state.owned.has(String(num))) miss.push(`${num}(${team.short})`);
      }
    });
    if (miss.length) lines.push(`Grupo ${g.letter}: ${miss.join(', ')}`);
  });
  const sm = ALBUM.specials.filter(s => !state.owned.has(s.id));
  if (sm.length) lines.push(`Especiales: ${sm.map(s => s.label).join(', ')}`);
  navigator.clipboard.writeText(lines.join('\n')).then(() => toast('📋 Lista copiada'));
});

// === Render: Gasto ===
function renderGasto() {
  const tbody = document.getElementById('gasto-body');
  tbody.innerHTML = '';
  state.gastos.forEach((row, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input data-field="fecha"  value="${row.fecha || ''}"></td>
      <td><input data-field="sobres" type="number" min="0" value="${row.sobres || 0}"></td>
      <td><input data-field="cromos" type="number" min="0" value="${row.cromos || 0}"></td>
      <td><input data-field="gasto"  type="number" min="0" step="0.01" value="${row.gasto || 0}"></td>
      <td><button class="row-delete" title="Eliminar">🗑️</button></td>
    `;
    tr.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', () => {
        const f = inp.dataset.field;
        state.gastos[idx][f] = f === 'fecha' ? inp.value : Number(inp.value || 0);
        saveState();
        renderGastoSummary();
      });
    });
    tr.querySelector('.row-delete').addEventListener('click', () => {
      state.gastos.splice(idx, 1);
      saveState();
      renderGasto();
    });
    tbody.appendChild(tr);
  });
  renderGastoSummary();
}

function renderGastoSummary() {
  const totSobres = state.gastos.reduce((s, r) => s + (Number(r.sobres)||0), 0);
  const totCromos = state.gastos.reduce((s, r) => s + (Number(r.cromos)||0), 0);
  const totGasto  = state.gastos.reduce((s, r) => s + (Number(r.gasto)||0), 0);
  const owned = totalOwned();
  const costPerOwned = owned > 0 ? (totGasto / owned).toFixed(2) : '0.00';
  document.getElementById('gasto-summary').innerHTML = `
    <div class="box"><div class="label">Sobres totales</div><div class="value">${totSobres}</div></div>
    <div class="box"><div class="label">Cromos abiertos</div><div class="value">${totCromos}</div></div>
    <div class="box"><div class="label">Gasto total</div><div class="value">${totGasto.toFixed(2)} €</div></div>
    <div class="box"><div class="label">€ / cromo álbum</div><div class="value">${costPerOwned} €</div></div>
  `;
}

document.getElementById('add-gasto').addEventListener('click', () => {
  state.gastos.push({ fecha: '', sobres: 0, cromos: 0, gasto: 0 });
  saveState();
  renderGasto();
});

// === Ajustes ===
function renderFirebaseStatus() {
  const card = document.getElementById('firebase-status-card');
  const text = document.getElementById('firebase-status-text');
  if (FIREBASE_ENABLED) {
    card.style.borderLeft = '4px solid #22c55e';
    text.innerHTML = `
      <p style="color:#065f46">✅ <strong>Firebase activo.</strong> Los cambios se sincronizan automáticamente en todos tus dispositivos.</p>
      <p style="margin-top:8px;font-size:13px;color:#6b7280">Proyecto: <code>${FIREBASE_CONFIG.projectId}</code> — Documento: <code>${FIREBASE_DOC_ID}</code></p>
    `;
  } else {
    card.style.borderLeft = '4px solid #f59e0b';
    text.innerHTML = `
      <p>⚠️ <strong>Firebase no configurado.</strong> Los datos solo se guardan en este navegador.</p>
      <p style="margin-top:8px;font-size:13px;color:#6b7280">Para activar la sincronización, sigue las instrucciones del <code>README.md</code> y rellena <code>js/firebase-config.js</code>.</p>
    `;
  }
}

document.getElementById('export-btn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(stateToData(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `panini2026-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('⬇️ JSON exportado');
});

document.getElementById('import-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!Array.isArray(data.owned)) throw new Error('Formato inválido');
      state = dataToState(data);
      saveState();
      renderAll();
      toast('✅ Datos importados');
    } catch (err) {
      alert('Error importando: ' + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

document.getElementById('reset-btn').addEventListener('click', () => {
  if (!confirm('¿Restablecer todos los datos al estado inicial del PDF?\nEsto borrará tus cambios.')) return;
  state = { owned: buildInitialOwned(), gastos: structuredClone(INITIAL_GASTOS) };
  saveState();
  renderAll();
  toast('🔄 Datos restablecidos');
});

// === Tabs ===
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('hidden', v.id !== `view-${name}`));
  if (name === 'resumen')    renderResumen();
  if (name === 'grupos')     renderGroup(currentGroup);
  if (name === 'especiales') renderEspeciales();
  if (name === 'faltantes')  renderFaltantes();
  if (name === 'gasto')      renderGasto();
  if (name === 'ajustes')    renderFirebaseStatus();
}
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));

// === Render todo ===
function renderAll() {
  renderGlobalProgress();
  // Solo re-render la vista activa (las demás se renderizan al hacer click)
  const activeTab = document.querySelector('.tab.active')?.dataset.tab;
  if (activeTab === 'resumen')    renderResumen();
  if (activeTab === 'grupos')     renderGroup(currentGroup);
  if (activeTab === 'especiales') renderEspeciales();
  if (activeTab === 'faltantes')  renderFaltantes();
  if (activeTab === 'gasto')      renderGasto();
  // El resumen siempre se actualiza
  renderResumen();
}

// === Init asíncrono ===
async function init() {
  // Inicializar Firebase (si está configurado)
  await SYNC.init(remoteData => {
    // Llegan cambios de otro dispositivo → actualizar UI
    state = dataToState(remoteData);
    renderAll();
    toast('🔄 Actualizado desde otro dispositivo');
  });

  // Cargar datos (Firebase si está disponible, localStorage como fallback)
  const data = await SYNC.load();
  if (data) {
    state = dataToState(data);
  } else {
    // Primera vez: datos iniciales del PDF
    state = { owned: buildInitialOwned(), gastos: structuredClone(INITIAL_GASTOS) };
    saveState();
  }

  renderAll();
  renderResumen(); // asegurar resumen al inicio
}

init();
