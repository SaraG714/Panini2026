# Álbum Panini FIFA World Cup 2026™ — García Agudelo

Tracker familiar para el álbum de cromos Panini 2026.

## Cómo abrir la app

Simplemente abre `index.html` en tu navegador. Sin servidor, sin instalaciones.

---

## Firebase Setup — Sincronización multi-dispositivo

Sigue estos pasos **una sola vez** para que todos los dispositivos de la familia compartan el mismo álbum en tiempo real.

### Paso 1 — Crear un proyecto en Firebase

1. Ve a **https://console.firebase.google.com** e inicia sesión con tu cuenta Google.
2. Haz click en **"Crear un proyecto"**.
3. Ponle un nombre (ej. `panini-2026`) y sigue los pasos. No necesitas Google Analytics.

### Paso 2 — Crear la base de datos (Firestore)

1. En el menú izquierdo del proyecto, ve a **Build → Firestore Database**.
2. Haz click en **"Crear base de datos"**.
3. Elige **"Comenzar en modo de prueba"** → Siguiente.
4. Elige la región `europe-west` (la más cercana).
5. Haz click en **"Habilitar"**.

### Paso 3 — Registrar la app web

1. En la página de inicio del proyecto, haz click en el icono **`</>`** (Añadir app web).
2. Dale un nombre (ej. `panini-tracker`) y haz click en **"Registrar app"**.
3. Verás un bloque de código como este:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "panini-2026.firebaseapp.com",
  projectId: "panini-2026",
  storageBucket: "panini-2026.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

4. **Copia esos valores** y pégalos en el archivo `js/firebase-config.js`.

### Paso 4 — Configurar reglas de seguridad

En la consola de Firebase, ve a **Firestore → Reglas** y pega esto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /panini2026/{docId} {
      allow read, write: if true;
    }
  }
}
```

Haz click en **"Publicar"**.

> ℹ️ Estas reglas permiten leer/escribir a cualquiera que conozca el ID del documento (`garcia-agudelo-2026`). Para uso familiar privado es suficiente.

### Paso 5 — Abrir la app

Recarga `index.html`. En la esquina superior derecha verás **"☁️ Sync ✓"** en verde.

¡Listo! Cualquier cambio que hagas en un dispositivo aparecerá automáticamente en los demás en menos de un segundo.

---

## Desplegar en GitHub Pages (opcional)

Para acceder desde cualquier dispositivo sin necesidad de abrir el archivo local:

1. Crea un repositorio en GitHub (puede ser privado).
2. Sube todos los archivos de esta carpeta.
3. En el repositorio: **Settings → Pages → Source: main branch → / (root)**.
4. Tu app estará en `https://tuusuario.github.io/nombre-del-repo/`.

---

## Estructura de archivos

```
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── data.js            ← datos del álbum + estado inicial del PDF
│   ├── firebase-config.js ← tu configuración Firebase (editar esto)
│   ├── sync.js            ← capa de sincronización Firebase ↔ localStorage
│   └── app.js             ← lógica principal de la app
└── README.md
```
