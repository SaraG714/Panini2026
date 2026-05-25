// ============================================================
// Estado de la app
// ============================================================
// state.members: array de { id, name, color, owned: {stickerId: count} }
// state.activeMemberId: string ID del miembro activo, o null = vista familiar
// state.gastos: array de entradas de gasto
// ============================================================

const VERSION = 2;
let state = { members: [], activeMemberId: null, gastos: [] };

// ── helpers de miembros ──────────────────────────────────────
function getActive() {
  return state.members.find(m => m.id === state.activeMemberId) || null;
}
function isFamilyView() { return !state.activeMemberId; }

// Cuenta de un cromo en el contexto activo
function getCount(id) {
  if (isFamilyView()) {
    return state.members.reduce((sum, m) => sum + (m.owned[id] || 0), 0);
  }
  return (getActive()?.owned[id]) || 0;
}

// Establece la cuenta de un cromo para el miembro activo
function setCount(id, count) {
  const m = getActive();
  if (!m) return false; // no se puede editar en vista familiar
  if (count <= 0) delete m.owned[id];
  else m.owned[id] = count;
  return true;
}

// Lista de miembros que tienen ese cromo
function getOwners(id) {
  return state.members.filter(m => (m.owned[id] || 0) > 0);
}

// Duplicados de un miembro: stickers con count > 1
function getMemberDuplicates(member) {
  return Object.entries(member.owned)
    .filter(([, c]) => c > 1)
    .map(([id, c]) => ({ id, count: c }));
}

// Duplicados familiares: stickers cuyo total entre todos los miembros > 1
function getFamilyDuplicates() {
  const allIds = new Set();
  state.members.forEach(m => Object.keys(m.owned).forEach(id => allIds.add(id)));
  const result = [];
  allIds.forEach(id => {
    const owners = state.members
      .filter(m => (m.owned[id] || 0) > 0)
      .map(m => ({ member: m, count: m.owned[id] }));
    const total = owners.reduce((s, o) => s + o.count, 0);
    if (total > 1) result.push({ id, total, owners });
  });
  result.sort((a, b) => {
    const na = parseInt(a.id), nb = parseInt(b.id);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.id.localeCompare(b.id);
  });
  return result;
}

// ── persistencia ─────────────────────────────────────────────
function stateToData() {
  return {
    version: VERSION,
    members: state.members.map(m => ({ ...m, owned: { ...m.owned } })),
    activeMemberId: state.activeMemberId,
    gastos: state.gastos,
  };
}

function dataToState(raw) {
  // Migración desde formato v1 (owned: string[])
  if (raw.version !== VERSION && Array.isArray(raw.owned)) {
    const owned = {};
    raw.owned.forEach(id => { owned[id] = 1; });
    return {
      members: [{ id: 'principal', name: 'Juanjo', color: MEMBER_COLORS[1], owned }],
      activeMemberId: 'principal',
      gastos: raw.gastos || [],
    };
  }
  return {
    members: (raw.members || []).map(m => ({ ...m, owned: m.owned || {} })),
    activeMemberId: raw.activeMemberId || null,
    gastos: raw.gastos || [],
  };
}

function saveState() {
  SYNC.save(stateToData());
}

// ── totales ──────────────────────────────────────────────────
function teamOwnedCount(team) {
  let c = 0;
  for (let i = 0; i < 20; i++) if (getCount(String(team.start + i)) > 0) c++;
  return c;
}
function groupOwnedCount(g) {
  return g.teams.reduce((s, t) => s + teamOwnedCount(t), 0);
}
function specialsOwnedCount() {
  return ALBUM.specials.reduce((s, x) => s + (getCount(x.id) > 0 ? 1 : 0), 0);
}
function totalOwned() {
  let c = specialsOwnedCount();
  ALBUM.groups.forEach(g => c += groupOwnedCount(g));
  return c;
}
function totalDuplicates() {
  // total de copias extra (por encima de 1) en el contexto activo
  if (isFamilyView()) {
    return state.members.reduce((sum, m) =>
      sum + Object.values(m.owned).reduce((s, c) => s + Math.max(0, c - 1), 0), 0);
  }
  const m = getActive();
  if (!m) return 0;
  return Object.values(m.owned).reduce((s, c) => s + Math.max(0, c - 1), 0);
}

// ── toast ────────────────────────────────────────────────────
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

// ════════════════════════════════════════════════════════════
// MIEMBROS — barra y modal
// ════════════════════════════════════════════════════════════
function renderMemberBar() {
  const chips = document.getElementById('member-chips');
  chips.innerHTML = '';

  // chip "Familia"
  const fam = document.createElement('button');
  fam.className = 'member-chip' + (isFamilyView() ? ' active' : '');
  fam.innerHTML = `<span class="mc-icon">🏠</span> Familia`;
  fam.addEventListener('click', () => { state.activeMemberId = null; onMemberSwitch(); });
  chips.appendChild(fam);

  state.members.forEach(m => {
    const chip = document.createElement('button');
    chip.className = 'member-chip' + (state.activeMemberId === m.id ? ' active' : '');
    chip.style.setProperty('--mc', m.color);
    const initials = m.name.slice(0, 2).toUpperCase();
    const dups = getMemberDuplicates(m).length;
    chip.innerHTML = `
      <span class="mc-avatar" style="background:${m.color}">${initials}</span>
      ${m.name}
      ${dups > 0 ? `<span class="mc-badge">${dups} rep.</span>` : ''}
    `;
    chip.addEventListener('click', () => { state.activeMemberId = m.id; onMemberSwitch(); });
    chips.appendChild(chip);
  });
}

function onMemberSwitch() {
  saveState();
  renderMemberBar();
  renderAll();
}

// ── Modal añadir/editar ──────────────────────────────────────
let modalEditId = null;

function openMemberModal(editId = null) {
  modalEditId = editId;
  const m = editId ? state.members.find(x => x.id === editId) : null;
  document.getElementById('modal-title').textContent = editId ? 'Editar miembro' : 'Nuevo miembro';
  document.getElementById('modal-name').value = m?.name || '';
  document.getElementById('modal-delete').classList.toggle('hidden', !editId);
  renderColorPicker(m?.color || MEMBER_COLORS[0]);
  document.getElementById('member-modal').classList.remove('hidden');
  document.getElementById('modal-name').focus();
}

function closeMemberModal() {
  document.getElementById('member-modal').classList.add('hidden');
}

function renderColorPicker(selected) {
  const picker = document.getElementById('modal-color-picker');
  picker.innerHTML = '';
  MEMBER_COLORS.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'color-swatch' + (c === selected ? ' selected' : '');
    btn.style.background = c;
    btn.dataset.color = c;
    btn.addEventListener('click', () => {
      picker.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      btn.classList.add('selected');
    });
    picker.appendChild(btn);
  });
}

function getSelectedColor() {
  return document.querySelector('.color-swatch.selected')?.dataset.color || MEMBER_COLORS[0];
}

document.getElementById('add-member-btn').addEventListener('click', () => openMemberModal());
document.getElementById('modal-cancel').addEventListener('click', closeMemberModal);
document.getElementById('member-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeMemberModal();
});

document.getElementById('modal-save').addEventListener('click', () => {
  const name = document.getElementById('modal-name').value.trim();
  if (!name) { document.getElementById('modal-name').focus(); return; }
  const color = getSelectedColor();
  if (modalEditId) {
    const m = state.members.find(x => x.id === modalEditId);
    if (m) { m.name = name; m.color = color; }
  } else {
    const id = 'member_' + Date.now();
    state.members.push({ id, name, color, owned: {} });
    state.activeMemberId = id;
  }
  saveState();
  closeMemberModal();
  renderMemberBar();
  renderAll();
});

document.getElementById('modal-delete').addEventListener('click', () => {
  if (!modalEditId) return;
  const m = state.members.find(x => x.id === modalEditId);
  if (!confirm(`¿Eliminar a ${m?.name}? Se perderán sus datos.`)) return;
  state.members = state.members.filter(x => x.id !== modalEditId);
  if (state.activeMemberId === modalEditId) state.activeMemberId = null;
  saveState();
  closeMemberModal();
  renderMemberBar();
  renderAll();
});

// ════════════════════════════════════════════════════════════
// WIDGET de contador de cromo [−] n [+]
// ════════════════════════════════════════════════════════════
function buildCountWidget(id, onUpdate) {
  const wrap = document.createElement('div');
  wrap.className = 'count-widget';

  function render() {
    wrap.innerHTML = '';
    const count = getCount(id); // lee el estado actual cada vez

    if (isFamilyView()) {
      const owners = getOwners(id);
      if (owners.length === 0) {
        wrap.innerHTML = `<span class="cw-nobody">—</span>`;
      } else {
        owners.forEach(m => {
          const c = m.owned[id] || 0;
          const el = document.createElement('span');
          el.className = 'cw-owner';
          el.style.background = m.color;
          el.title = `${m.name}: ${c} copia${c > 1 ? 's' : ''}`;
          el.textContent = m.name.slice(0, 2).toUpperCase() + (c > 1 ? ` ×${c}` : '');
          wrap.appendChild(el);
        });
      }
    } else if (count === 0) {
      const btn = document.createElement('button');
      btn.className = 'cw-add';
      btn.textContent = '＋';
      btn.title = 'Marcar como conseguido';
      btn.addEventListener('click', e => {
        e.stopPropagation();
        setCount(id, 1);
        saveState();
        render();
        onUpdate();
      });
      wrap.appendChild(btn);
    } else {
      const minus = document.createElement('button');
      minus.className = 'cw-btn cw-minus';
      minus.textContent = '−';
      minus.title = 'Quitar una copia';
      minus.addEventListener('click', e => {
        e.stopPropagation();
        setCount(id, count - 1);
        saveState();
        render();
        onUpdate();
      });

      const num = document.createElement('span');
      num.className = 'cw-num' + (count > 1 ? ' cw-dup' : '');
      num.textContent = count;
      num.title = count === 1 ? 'Tienes 1 copia' : `Tienes ${count} copias (${count - 1} repetida${count > 2 ? 's' : ''})`;

      const plus = document.createElement('button');
      plus.className = 'cw-btn cw-plus';
      plus.textContent = '＋';
      plus.title = 'Añadir copia extra (repetida)';
      plus.addEventListener('click', e => {
        e.stopPropagation();
        setCount(id, count + 1);
        saveState();
        render();
        onUpdate();
      });

      wrap.appendChild(minus);
      wrap.appendChild(num);
      wrap.appendChild(plus);
    }
  }

  render();
  return wrap;
}

// ════════════════════════════════════════════════════════════
// TOPBAR PROGRESS
// ════════════════════════════════════════════════════════════
function renderGlobalProgress() {
  const total = totalOwned();
  const pct = ((total / 980) * 100).toFixed(1);
  document.getElementById('gp-count').textContent = `${total} / 980`;
  document.getElementById('gp-percent').textContent = `${pct}%`;
  document.getElementById('gp-fill').style.width = pct + '%';
}

// ════════════════════════════════════════════════════════════
// RESUMEN
// ════════════════════════════════════════════════════════════
function renderResumen() {
  const label = isFamilyView() ? '🏠 Familia completa' : `👤 ${getActive()?.name}`;
  document.getElementById('resumen-context').textContent = label;

  const grid = document.getElementById('resumen-grid');
  grid.innerHTML = '';

  ALBUM.groups.forEach(g => {
    const owned = groupOwnedCount(g);
    const pct = ((owned / 80) * 100).toFixed(1);
    const card = document.createElement('div');
    card.className = 'resumen-card';
    card.style.borderLeftColor = g.color;
    card.innerHTML = `
      <div class="resumen-card-header">
        <h3>Grupo ${g.letter}</h3>
        <span class="pct" style="color:${g.color}">${pct}%</span>
      </div>
      <div class="countries">${g.teams.map(t => t.short).join(' · ')}</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${pct}%;background:${g.color}"></div>
      </div>
      <div class="stats">
        <span>✅ ${owned}/80</span>
        <span class="missing">❌ Faltan ${80 - owned}</span>
      </div>
    `;
    card.addEventListener('click', () => { switchTab('grupos'); renderGroup(g.letter); });
    grid.appendChild(card);
  });

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

  // Resumen por miembro (siempre visible)
  if (state.members.length > 1 || isFamilyView()) {
    const sec = document.createElement('div');
    sec.className = 'resumen-members-section';
    sec.innerHTML = '<h3 class="resumen-members-title">Por miembro</h3>';
    const membersGrid = document.createElement('div');
    membersGrid.className = 'resumen-members-grid';
    state.members.forEach(m => {
      // calcular owned del miembro (ignorar contexto activo)
      let mOwned = 0;
      ALBUM.groups.forEach(g => g.teams.forEach(t => {
        for (let i = 0; i < 20; i++) if ((m.owned[String(t.start+i)] || 0) > 0) mOwned++;
      }));
      ALBUM.specials.forEach(s => { if ((m.owned[s.id] || 0) > 0) mOwned++; });
      const mPct = ((mOwned / 980) * 100).toFixed(1);
      const mDups = getMemberDuplicates(m).length;
      const card = document.createElement('div');
      card.className = 'member-stat-card';
      card.style.borderLeftColor = m.color;
      card.innerHTML = `
        <div class="msc-header">
          <span class="msc-avatar" style="background:${m.color}">${m.name.slice(0,2).toUpperCase()}</span>
          <span class="msc-name">${m.name}</span>
          <span class="msc-pct">${mPct}%</span>
        </div>
        <div class="progress-bar" style="margin:6px 0">
          <div class="progress-fill" style="width:${mPct}%;background:${m.color}"></div>
        </div>
        <div class="msc-stats">
          <span>✅ ${mOwned}/980</span>
          ${mDups > 0 ? `<span class="msc-dups">🔁 ${mDups} repetidas</span>` : ''}
        </div>
      `;
      card.addEventListener('click', () => {
        state.activeMemberId = m.id;
        saveState();
        renderMemberBar();
        renderAll();
      });
      membersGrid.appendChild(card);
    });
    sec.appendChild(membersGrid);
    grid.appendChild(sec);
  }
}

// ════════════════════════════════════════════════════════════
// GRUPOS
// ════════════════════════════════════════════════════════════
let currentGroup = 'A';

function renderGroupNav() {
  const nav = document.getElementById('group-nav');
  nav.innerHTML = '';
  ALBUM.groups.forEach(g => {
    const btn = document.createElement('button');
    btn.className = 'group-nav-btn' + (g.letter === currentGroup ? ' active' : '');
    btn.textContent = `Grupo ${g.letter}`;
    if (g.letter === currentGroup) { btn.style.background = g.color; btn.style.borderColor = g.color; }
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
  const editHint = isFamilyView()
    ? '<span class="hint-badge">Vista solo lectura — selecciona un miembro para editar</span>' : '';

  content.innerHTML = `
    <div class="group-header">
      <h2 style="background:${g.color}">Grupo ${g.letter}</h2>
      <div class="group-stats">
        <span class="pill owned">✅ ${owned}/80</span>
        <span class="pill missing">❌ Faltan ${80 - owned}</span>
        <span class="pill">${((owned/80)*100).toFixed(1)}%</span>
        ${editHint}
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

  const countSpan = document.createElement('span');
  countSpan.className = 'count';
  countSpan.textContent = `${ownedCount}/20`;
  header.innerHTML = `<span><span class="flag">${team.flag}</span> ${team.name}</span>`;
  header.appendChild(countSpan);
  card.appendChild(header);

  const list = document.createElement('div');
  list.className = 'sticker-list';

  for (let i = 0; i < 20; i++) {
    const num = team.start + i;
    const id = String(num);
    const isSpecial = (i === 0 || i === 12);
    const count = getCount(id);
    const row = document.createElement('div');
    row.className = 'sticker' + (count > 0 ? ' owned' : '') + (isSpecial ? ' special-row' : '') + (count > 1 ? ' duplicated' : '');

    const numEl = document.createElement('span');
    numEl.className = 'num';
    numEl.textContent = i + 1;

    const labelEl = document.createElement('span');
    labelEl.className = 'label';
    labelEl.textContent = stickerLabel(team, num);

    const widget = buildCountWidget(id, () => {
      const newCount = getCount(id);
      row.className = 'sticker' + (newCount > 0 ? ' owned' : '') + (isSpecial ? ' special-row' : '') + (newCount > 1 ? ' duplicated' : '');
      countSpan.textContent = `${teamOwnedCount(team)}/20`;
      renderGlobalProgress();
    });

    row.appendChild(numEl);
    row.appendChild(labelEl);
    row.appendChild(widget);
    list.appendChild(row);
  }
  card.appendChild(list);
  return card;
}

// ════════════════════════════════════════════════════════════
// ESPECIALES
// ════════════════════════════════════════════════════════════
function renderEspeciales() {
  const label = isFamilyView() ? '🏠 Familia' : `👤 ${getActive()?.name}`;
  document.getElementById('especiales-context').textContent = label;
  const grid = document.getElementById('specials-grid');
  grid.innerHTML = '';
  ALBUM.specials.forEach(s => {
    const count = getCount(s.id);
    const card = document.createElement('div');
    card.className = 'special-card' + (count > 0 ? ' owned' : '') + (count > 1 ? ' duplicated' : '');
    card.innerHTML = `<span class="code">${s.label}</span><span class="desc">${s.desc}</span>`;
    const widget = buildCountWidget(s.id, () => {
      const nc = getCount(s.id);
      card.className = 'special-card' + (nc > 0 ? ' owned' : '') + (nc > 1 ? ' duplicated' : '');
      renderGlobalProgress();
    });
    card.appendChild(widget);
    grid.appendChild(card);
  });
}

// ════════════════════════════════════════════════════════════
// REPETIDAS
// ════════════════════════════════════════════════════════════
function renderRepetidas() {
  const container = document.getElementById('repetidas-list');
  container.innerHTML = '';

  const dups = totalDuplicates();
  document.getElementById('repetidas-count').textContent = `🔁 ${dups} copia${dups !== 1 ? 's' : ''} extra`;

  if (isFamilyView()) {
    document.getElementById('repetidas-context').textContent = '🏠 Familia';
    const famDups = getFamilyDuplicates();
    document.getElementById('repetidas-count').textContent =
      `🔁 ${famDups.length} cromo${famDups.length !== 1 ? 's' : ''} repetido${famDups.length !== 1 ? 's' : ''} en familia`;

    if (!famDups.length) {
      container.innerHTML = '<div class="faltantes-empty">✅ Sin repetidos — ¡nadie comparte ningún cromo!</div>';
      return;
    }

    // Agrupar por grupo
    ALBUM.groups.forEach(g => {
      const groupDups = famDups.filter(({ id }) => {
        const num = parseInt(id);
        return g.teams.some(t => num >= t.start && num < t.start + 20);
      });
      if (!groupDups.length) return;
      const block = document.createElement('div');
      block.className = 'faltantes-group';
      block.innerHTML = `
        <div class="faltantes-group-header" style="background:${g.color}">
          Grupo ${g.letter} — ${groupDups.length} con repetidos
        </div>
        <div class="faltantes-items"></div>
      `;
      const items = block.querySelector('.faltantes-items');
      groupDups.forEach(({ id, owners }) => {
        const info = findStickerInfo(id);
        const ownersText = owners.map(o =>
          `<span class="cw-owner" style="background:${o.member.color}" title="${o.member.name}">${o.member.name.slice(0,2).toUpperCase()}${o.count > 1 ? ` ×${o.count}` : ''}</span>`
        ).join('');
        const item = document.createElement('span');
        item.className = 'faltantes-item dup-item';
        item.title = info.label;
        item.innerHTML = `${id} ${info.short} ${ownersText}`;
        items.appendChild(item);
      });
      container.appendChild(block);
    });

    // Especiales
    const specDups = famDups.filter(({ id }) => ALBUM.specials.some(s => s.id === id));
    if (specDups.length) {
      const block = document.createElement('div');
      block.className = 'faltantes-group';
      block.innerHTML = `
        <div class="faltantes-group-header" style="background:#d97706">
          ⭐ Especiales — ${specDups.length} con repetidos
        </div>
        <div class="faltantes-items"></div>
      `;
      const items = block.querySelector('.faltantes-items');
      specDups.forEach(({ id, owners }) => {
        const sp = ALBUM.specials.find(s => s.id === id);
        const ownersText = owners.map(o =>
          `<span class="cw-owner" style="background:${o.member.color}" title="${o.member.name}">${o.member.name.slice(0,2).toUpperCase()}${o.count > 1 ? ` ×${o.count}` : ''}</span>`
        ).join('');
        const item = document.createElement('span');
        item.className = 'faltantes-item dup-item';
        item.innerHTML = `${sp.label} ${ownersText}`;
        items.appendChild(item);
      });
      container.appendChild(block);
    }
    return;
  } else {
    const m = getActive();
    document.getElementById('repetidas-context').textContent = `👤 ${m?.name}`;
    if (!m) return;
    const mDups = getMemberDuplicates(m);
    if (!mDups.length) {
      container.innerHTML = '<div class="faltantes-empty">✅ Sin repetidos — ¡todo único!</div>';
      return;
    }
    // Agrupar por grupo
    ALBUM.groups.forEach(g => {
      const groupDups = mDups.filter(({ id }) => {
        const num = parseInt(id);
        return g.teams.some(t => num >= t.start && num < t.start + 20);
      });
      if (!groupDups.length) return;
      const block = document.createElement('div');
      block.className = 'faltantes-group';
      block.innerHTML = `
        <div class="faltantes-group-header" style="background:${g.color}">
          Grupo ${g.letter} — ${groupDups.length} con repetidos
        </div>
        <div class="faltantes-items"></div>
      `;
      const items = block.querySelector('.faltantes-items');
      groupDups.forEach(({ id, count }) => {
        const info = findStickerInfo(id);
        const item = document.createElement('span');
        item.className = 'faltantes-item dup-item';
        item.title = info.label;
        item.textContent = `${id} ${info.short} ×${count}`;
        item.addEventListener('click', () => {
          setCount(id, count - 1);
          saveState();
          renderRepetidas();
          renderGlobalProgress();
          toast(`Quitada 1 copia de #${id}`);
        });
        items.appendChild(item);
      });
      container.appendChild(block);
    });
    // Especiales repetidas
    const specDups = mDups.filter(({ id }) => ALBUM.specials.some(s => s.id === id));
    if (specDups.length) {
      const block = document.createElement('div');
      block.className = 'faltantes-group';
      block.innerHTML = `
        <div class="faltantes-group-header" style="background:#d97706">
          ⭐ Especiales — ${specDups.length} con repetidos
        </div>
        <div class="faltantes-items"></div>
      `;
      const items = block.querySelector('.faltantes-items');
      specDups.forEach(({ id, count }) => {
        const sp = ALBUM.specials.find(s => s.id === id);
        const item = document.createElement('span');
        item.className = 'faltantes-item dup-item';
        item.textContent = `${sp.label} ×${count}`;
        items.appendChild(item);
      });
      container.appendChild(block);
    }
  }

  document.getElementById('repetidas-count').textContent =
    `🔁 ${totalDuplicates()} copia${totalDuplicates() !== 1 ? 's' : ''} extra`;
}

// helper para buscar info de un cromo por id
function findStickerInfo(id) {
  for (const g of ALBUM.groups) {
    for (const t of g.teams) {
      const num = parseInt(id);
      if (num >= t.start && num < t.start + 20) {
        return { short: t.short, label: `${t.name} — ${stickerLabel(t, num)}` };
      }
    }
  }
  const sp = ALBUM.specials.find(s => s.id === id);
  return sp ? { short: sp.label, label: sp.desc } : { short: id, label: id };
}

document.getElementById('copy-repetidas').addEventListener('click', () => {
  const lines = ['🔁 Repetidas para intercambiar — Panini WC 2026:'];
  if (isFamilyView()) {
    const famDups = getFamilyDuplicates();
    famDups.forEach(({ id, owners }) => {
      const info = findStickerInfo(id);
      const ownersText = owners.map(o => `${o.member.name}${o.count > 1 ? ` ×${o.count}` : ''}`).join(' + ');
      lines.push(`#${id} ${info.short} — ${ownersText}`);
    });
  } else {
    const m = getActive();
    if (!m) return;
    const dups = getMemberDuplicates(m);
    lines.push(dups.map(({ id, count }) => `#${id} ×${count-1}`).join(', ') || 'Sin repetidas');
  }
  navigator.clipboard.writeText(lines.join('\n')).then(() => toast('📋 Lista de repetidas copiada'));
});

// ════════════════════════════════════════════════════════════
// FALTANTES
// ════════════════════════════════════════════════════════════
function renderFaltantes() {
  const label = isFamilyView() ? '🏠 Familia' : `👤 ${getActive()?.name}`;
  document.getElementById('faltantes-context').textContent = label;
  const container = document.getElementById('faltantes-list');
  container.innerHTML = '';

  const missing = 980 - totalOwned();
  document.getElementById('faltantes-count').textContent = `❌ ${missing} faltan`;

  if (missing === 0) {
    container.innerHTML = '<div class="faltantes-empty">🏆 ¡Álbum completo! Felicidades.</div>';
    return;
  }

  ALBUM.groups.forEach(g => {
    const mList = [];
    g.teams.forEach(t => {
      for (let i = 0; i < 20; i++) {
        const num = t.start + i;
        if (getCount(String(num)) === 0) mList.push({ num, team: t });
      }
    });
    if (!mList.length) return;
    const block = document.createElement('div');
    block.className = 'faltantes-group';
    block.innerHTML = `
      <div class="faltantes-group-header" style="background:${g.color}">
        Grupo ${g.letter} — ${mList.length} faltantes
      </div>
      <div class="faltantes-items"></div>
    `;
    const items = block.querySelector('.faltantes-items');
    mList.forEach(({ num, team }) => {
      const item = document.createElement('span');
      item.className = 'faltantes-item';
      item.title = `${team.name} — ${stickerLabel(team, num)}`;
      item.textContent = `${num} ${team.short}`;
      item.addEventListener('click', () => {
        if (!setCount(String(num), 1)) { toast('Selecciona un miembro para editar'); return; }
        saveState();
        renderAll();
        toast(`✅ Marcado #${num} (${team.name})`);
      });
      items.appendChild(item);
    });
    container.appendChild(block);
  });

  const sMissing = ALBUM.specials.filter(s => getCount(s.id) === 0);
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
      item.textContent = `${s.label}`;
      item.title = s.desc;
      item.addEventListener('click', () => {
        if (!setCount(s.id, 1)) { toast('Selecciona un miembro para editar'); return; }
        saveState();
        renderAll();
        toast(`✅ Marcado ${s.label}`);
      });
      items.appendChild(item);
    });
    container.appendChild(block);
  }
}

document.getElementById('copy-faltantes').addEventListener('click', () => {
  const lines = ['❌ Cromos que faltan — Panini WC 2026:'];
  ALBUM.groups.forEach(g => {
    const miss = [];
    g.teams.forEach(t => {
      for (let i = 0; i < 20; i++) {
        const num = t.start + i;
        if (getCount(String(num)) === 0) miss.push(`${num}(${t.short})`);
      }
    });
    if (miss.length) lines.push(`Grupo ${g.letter}: ${miss.join(', ')}`);
  });
  const sm = ALBUM.specials.filter(s => getCount(s.id) === 0);
  if (sm.length) lines.push(`Especiales: ${sm.map(s => s.label).join(', ')}`);
  navigator.clipboard.writeText(lines.join('\n')).then(() => toast('📋 Lista de faltantes copiada'));
});

// ════════════════════════════════════════════════════════════
// GASTO
// ════════════════════════════════════════════════════════════
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
        saveState(); renderGastoSummary();
      });
    });
    tr.querySelector('.row-delete').addEventListener('click', () => {
      state.gastos.splice(idx, 1); saveState(); renderGasto();
    });
    tbody.appendChild(tr);
  });
  renderGastoSummary();
}

function renderGastoSummary() {
  const ts = state.gastos.reduce((s, r) => s + (Number(r.sobres)||0), 0);
  const tc = state.gastos.reduce((s, r) => s + (Number(r.cromos)||0), 0);
  const tg = state.gastos.reduce((s, r) => s + (Number(r.gasto)||0), 0);
  const owned = totalOwned();
  document.getElementById('gasto-summary').innerHTML = `
    <div class="box"><div class="label">Sobres</div><div class="value">${ts}</div></div>
    <div class="box"><div class="label">Cromos abiertos</div><div class="value">${tc}</div></div>
    <div class="box"><div class="label">Gasto total</div><div class="value">${tg.toFixed(2)} €</div></div>
    <div class="box"><div class="label">€ / cromo álbum</div><div class="value">${owned > 0 ? (tg/owned).toFixed(2) : '0.00'} €</div></div>
  `;
}

document.getElementById('add-gasto').addEventListener('click', () => {
  const today = new Date();
  const fecha = `${today.getDate()}-${today.getMonth()+1}`;
  state.gastos.push({ fecha, sobres: 0, cromos: 0, gasto: 0 });
  saveState(); renderGasto();
});

// ════════════════════════════════════════════════════════════
// AJUSTES
// ════════════════════════════════════════════════════════════
function renderFirebaseStatus() {
  const card = document.getElementById('firebase-status-card');
  const text = document.getElementById('firebase-status-text');
  if (FIREBASE_ENABLED) {
    card.style.borderLeft = '4px solid #22c55e';
    text.innerHTML = `<p style="color:#065f46">✅ <strong>Firebase activo.</strong> Sincronización automática entre todos tus dispositivos.</p>
      <p style="margin-top:8px;font-size:13px;color:#6b7280">Proyecto: <code>${FIREBASE_CONFIG.projectId}</code></p>`;
  } else {
    card.style.borderLeft = '4px solid #f59e0b';
    text.innerHTML = `<p>⚠️ <strong>Firebase no configurado.</strong> Datos solo en este navegador.</p>
      <p style="margin-top:8px;font-size:13px;color:#6b7280">Sigue las instrucciones del <code>README.md</code> y rellena <code>js/firebase-config.js</code>.</p>`;
  }
}

function renderMembersAjustes() {
  const list = document.getElementById('members-list-ajustes');
  list.innerHTML = '';
  state.members.forEach(m => {
    const row = document.createElement('div');
    row.className = 'member-ajuste-row';
    const mDups = getMemberDuplicates(m).length;
    let mOwned = 0;
    ALBUM.groups.forEach(g => g.teams.forEach(t => {
      for (let i = 0; i < 20; i++) if ((m.owned[String(t.start+i)] || 0) > 0) mOwned++;
    }));
    row.innerHTML = `
      <span class="maj-avatar" style="background:${m.color}">${m.name.slice(0,2).toUpperCase()}</span>
      <div class="maj-info">
        <strong>${m.name}</strong>
        <span>${mOwned}/980 cromos · ${mDups} repetidas</span>
      </div>
      <button class="btn-secondary maj-edit" data-id="${m.id}">✏️ Editar</button>
    `;
    row.querySelector('.maj-edit').addEventListener('click', () => openMemberModal(m.id));
    list.appendChild(row);
  });
  if (!state.members.length) {
    list.innerHTML = '<p style="color:#6b7280">Aún no hay miembros. Añade uno con el botón "＋ Añadir" de arriba.</p>';
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
      state = dataToState(data);
      saveState(); renderAll();
      toast('✅ Datos importados');
    } catch (err) { alert('Error importando: ' + err.message); }
  };
  reader.readAsText(file);
  e.target.value = '';
});

document.getElementById('reset-btn').addEventListener('click', () => {
  if (!confirm('¿Restablecer? Esto borrará todos los datos y dejará un solo miembro con el estado inicial del PDF.')) return;
  state = {
    members: [{ id: 'principal', name: 'Juanjo', color: MEMBER_COLORS[1], owned: buildInitialOwnedMap() }
],
    activeMemberId: 'principal',
    gastos: structuredClone(INITIAL_GASTOS),
  };
  saveState(); renderAll();
  toast('🔄 Datos restablecidos');
});

// ════════════════════════════════════════════════════════════
// TABS
// ════════════════════════════════════════════════════════════
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('hidden', v.id !== `view-${name}`));
  if (name === 'resumen')    renderResumen();
  if (name === 'grupos')     renderGroup(currentGroup);
  if (name === 'especiales') renderEspeciales();
  if (name === 'repetidas')  renderRepetidas();
  if (name === 'faltantes')  renderFaltantes();
  if (name === 'gasto')      renderGasto();
  if (name === 'ajustes')    { renderFirebaseStatus(); renderMembersAjustes(); }
}
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));

// ════════════════════════════════════════════════════════════
// RENDER GENERAL
// ════════════════════════════════════════════════════════════
function renderAll() {
  renderGlobalProgress();
  renderMemberBar();
  const activeTab = document.querySelector('.tab.active')?.dataset.tab || 'resumen';
  switchTab(activeTab);
}

// ════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════
async function init() {
  await SYNC.init(remoteData => {
    state = dataToState(remoteData);
    renderAll();
    toast('🔄 Actualizado desde otro dispositivo');
  });

  const data = await SYNC.load();
  if (data && (data.members?.length || data.owned)) {
    state = dataToState(data);
    // Migración: si el miembro principal aún se llama 'Sara', renombrarlo a 'Juanjo'
    const principal = state.members.find(m => m.id === 'principal' && m.name === 'Sara');
    if (principal) {
      principal.name = 'Juanjo';
      principal.color = MEMBER_COLORS[1];
      saveState();
    }
  } else {
    // Primera vez
    state = {
      members: [{ id: 'principal', name: 'Juanjo', color: MEMBER_COLORS[1], owned: buildInitialOwnedMap() }
],
      activeMemberId: 'principal',
      gastos: structuredClone(INITIAL_GASTOS),
    };
    saveState();
  }
  renderAll();
}

init();

// Ajustar top del member-bar según altura real del topbar
function adjustMemberBarTop() {
  const h = document.querySelector('.topbar')?.offsetHeight || 110;
  document.querySelector('.member-bar').style.top = h + 'px';
}
adjustMemberBarTop();
window.addEventListener('resize', adjustMemberBarTop);
