// ============================================================
// CONFIGURACIÓN FIREBASE — rellena con tus datos del proyecto
// ============================================================
// Instrucciones en README.md (sección "Firebase Setup")

const FIREBASE_CONFIG = {
  apiKey:            "PEGA_AQUÍ_TU_apiKey",
  authDomain:        "PEGA_AQUÍ_TU_authDomain",
  projectId:         "PEGA_AQUÍ_TU_projectId",
  storageBucket:     "PEGA_AQUÍ_TU_storageBucket",
  messagingSenderId: "PEGA_AQUÍ_TU_messagingSenderId",
  appId:             "PEGA_AQUÍ_TU_appId",
};

// ID del documento compartido — todos los dispositivos de la familia
// usarán ESTE mismo documento para sincronizar.
// Puedes dejarlo así o cambiarlo por cualquier nombre que quieras.
const FIREBASE_DOC_ID = "garcia-agudelo-2026";

// ¿Está configurado Firebase? (se detecta automáticamente)
const FIREBASE_ENABLED = FIREBASE_CONFIG.apiKey !== "PEGA_AQUÍ_TU_apiKey";
