// ============================================================
// CONFIGURACIÓN FIREBASE — rellena con tus datos del proyecto
// ============================================================
// Instrucciones en README.md (sección "Firebase Setup")

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyBTiWt8OkPpdk1t2CSCmTTNU5TOXAOkGVo",
  authDomain:        "panini2026-48c24.firebaseapp.com",
  projectId:         "panini2026-48c24",
  storageBucket:     "panini2026-48c24.firebasestorage.app",
  messagingSenderId: "781184836608",
  appId:             "1:781184836608:web:61a6ab88c1bdcef83aa4e5",
};

// ID del documento compartido — todos los dispositivos de la familia
// usarán ESTE mismo documento para sincronizar.
// Puedes dejarlo así o cambiarlo por cualquier nombre que quieras.
const FIREBASE_DOC_ID = "garcia-agudelo-2026";

// ¿Está configurado Firebase? (se detecta automáticamente)
const FIREBASE_ENABLED = FIREBASE_CONFIG.apiKey !== "PEGA_AQUÍ_TU_apiKey";
