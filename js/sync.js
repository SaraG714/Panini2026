// ============================================================
// Capa de sincronización Firebase ↔ localStorage
// ============================================================
// - Si Firebase está configurado: usa Firestore + localStorage como backup offline
// - Si no está configurado:       usa solo localStorage (modo local)
// ============================================================

const SYNC = (() => {
  let db = null;
  let docRef = null;
  let onRemoteChange = null;  // callback cuando llegan cambios de otro dispositivo
  let saveTimer = null;
  let lastSavedOwned = null;  // para evitar writes innecesarios

  // --- Indicador visual de estado de sync ---
  const indicator = document.getElementById('sync-indicator');
  function setSyncStatus(status) {
    // status: 'off' | 'saving' | 'saved' | 'error'
    if (!indicator) return;
    const states = {
      off:    { text: '📵 Sin sync',   cls: 'sync-off' },
      saving: { text: '☁️ Guardando…', cls: 'sync-saving' },
      saved:  { text: '☁️ Sync ✓',     cls: 'sync-ok' },
      error:  { text: '⚠️ Error sync', cls: 'sync-error' },
    };
    const s = states[status] || states.off;
    indicator.textContent = s.text;
    indicator.className = 'sync-indicator ' + s.cls;
  }

  // --- Init ---
  async function init(onChangeFn) {
    onRemoteChange = onChangeFn;
    if (!FIREBASE_ENABLED) {
      setSyncStatus('off');
      return false;
    }
    try {
      firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.firestore();
      docRef = db.collection('panini2026').doc(FIREBASE_DOC_ID);

      // Escuchar cambios en tiempo real de otros dispositivos
      docRef.onSnapshot(snap => {
        if (!snap.exists) return;
        const raw = snap.data();
        if (raw._source === getDeviceId()) return;
        const data = deserializeFirestore(raw);
        if (onRemoteChange) onRemoteChange(data);
      }, err => {
        console.error('Firestore onSnapshot error:', err);
        setSyncStatus('error');
      });

      setSyncStatus('saved');
      return true;
    } catch (err) {
      console.error('Firebase init error:', err);
      setSyncStatus('error');
      return false;
    }
  }

  // --- Carga inicial ---
  async function load() {
    // Primero cargamos de localStorage (respuesta inmediata)
    let localData = null;
    try {
      const raw = localStorage.getItem('panini2026');
      if (raw) localData = JSON.parse(raw);
    } catch (e) { /* nada */ }

    if (!FIREBASE_ENABLED || !docRef) return localData;

    try {
      const snap = await docRef.get();
      if (snap.exists) {
        const remoteData = deserializeFirestore(snap.data());
        const remoteTime = snap.data().updatedAt?.toMillis?.() || 0;
        const localTime = localData?.savedAt ? new Date(localData.savedAt).getTime() : 0;
        if (remoteTime >= localTime) return remoteData;
      }
    } catch (err) {
      console.warn('Firestore load error (usando datos locales):', err);
    }
    return localData;
  }

  // --- Guarda (con debounce para no saturar Firestore) ---
  function save(data) {
    const payload = { ...data, savedAt: new Date().toISOString() };
    // Guardar siempre en localStorage (backup offline)
    localStorage.setItem('panini2026', JSON.stringify(payload));

    if (!FIREBASE_ENABLED || !docRef) return;

    // Firestore no admite objetos con claves numéricas muy anidadas de forma óptima.
    // Serializamos los owned maps como JSON string para evitar problemas de profundidad.
    const firestorePayload = {
      ...data,
      // Serializar owned de cada miembro como string
      members: (data.members || []).map(m => ({
        ...m,
        owned: JSON.stringify(m.owned || {}),
      })),
      _source: getDeviceId(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    // Debounce: espera 800ms desde el último cambio antes de escribir a Firestore
    clearTimeout(saveTimer);
    setSyncStatus('saving');
    saveTimer = setTimeout(async () => {
      try {
        await docRef.set(firestorePayload);
        setSyncStatus('saved');
      } catch (err) {
        console.error('Firestore save error:', err);
        setSyncStatus('error');
      }
    }, 800);
  }

  // --- ID estable por dispositivo (para evitar eco) ---
  function getDeviceId() {
    let id = localStorage.getItem('_panini_device_id');
    if (!id) {
      id = Math.random().toString(36).slice(2);
      localStorage.setItem('_panini_device_id', id);
    }
    return id;
  }

  // Deserializar owned de cada miembro (estaban guardados como JSON string)
  function deserializeFirestore(data) {
    if (!data.members) return data;
    return {
      ...data,
      members: data.members.map(m => ({
        ...m,
        owned: typeof m.owned === 'string' ? JSON.parse(m.owned) : (m.owned || {}),
      })),
    };
  }

  return { init, load, save, setSyncStatus };
})();
