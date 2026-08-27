# 👑 HexaGuys Pro — Plataforma Hexagonal de Supervivencia 3D

<div align="center">

![HexaGuys Pro Banner](https://raw.githubusercontent.com/H3ckyDev/hexaguys/main/public/favicon.svg)

**Un juego multijugador 3D en tiempo real inspirado en Hex-A-Gone / Fall Guys, desarrollado con React Three Fiber, físicas Rapier y sincronización WebRTC de baja latencia.**

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r160-black?logo=threedotjs&logoColor=white)](https://threejs.org/)
[![@react-three/fiber](https://img.shields.io/badge/R3F-v8-049EF4?logo=threedotjs&logoColor=white)](https://docs.pmnd.rs/react-three-fiber/)
[![Rapier Physics](https://img.shields.io/badge/Rapier_Physics-3D-E35532?logo=rust&logoColor=white)](https://rapier.rs/)
[![PlayroomKit](https://img.shields.io/badge/PlayroomKit-Multiplayer-7C3AED)](https://joinplayroom.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-v6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 📖 Índice

- [✨ Características Principales](#-características-principales)
- [🎮 Controles del Juego](#-controles-del-juego)
- [🗺️ Mapas y Modos de Juego](#️-mapas-y-modos-de-juego)
- [🤖 Skins y Personalización](#-skins-y-personalización)
- [💤 Sistema Inteligente de Inactividad (AFK)](#-sistema-inteligente-de-inactividad-afk)
- [💬 Chat Multijugador en Tiempo Real](#-chat-multijugador-en-tiempo-real)
- [🛠️ Arquitectura y Tecnologías](#️-arquitectura-y-tecnologías)
- [🚀 Instalación y Ejecución Local](#-instalación-y-ejecución-local)
- [📦 Estructura del Proyecto](#-estructura-del-proyecto)
- [📄 Licencia](#-licencia)

---

## ✨ Características Principales

* 🌐 **Multijugador en Tiempo Real:** Salas P2P con PlayroomKit para invitar amigos mediante enlace directo o código de sala de 4 dígitos.
* ⚡ **Físicas de Precisión en 3D:** Motor de físicas Rapier 3D optimizado con colisionadores de cápsula, frenado instantáneo al soltar teclas, aceleración en sprint y giro matemático suave con inclinación en curvas (*banking*).
* 🧱 **Baldosas Hexagonales Dinámicas:** Cada baldosa pisada vibra y cambia a rojo de alerta antes de colapsar al vacío en 2 segundos.
* 👁️ **Transparencia Superior Inteligente:** Las baldosas de los pisos superiores se vuelven translúcidas suavemente cuando estás debajo para garantizar visibilidad total de tu personaje en todo momento.
* 💬 **Chat Flotante con Burbujas 3D:** Los mensajes se muestran en el chat global y en burbujas estilo cómic sobre la cabeza de tu avatar.
* 💤 **Control Inteligente de AFK:** Detección de inactividad por falta de teclas o cambio de pestaña, badges 3D `💤 AFK`, cancelación automática si hay menos de 2 activos y expulsión tras 60 segundos.
* 📊 **HUD de Rendimiento en Vivo:** Contador de FPS y monitor de latencia (Ping) real con suavizado exponencial EMA.
* ⚙️ **Menú de Ajustes Flotante (`ESC`):** Control de volumen de audio estéreo Web Audio API, alternadores de HUD y visualización opcional de ping sobre los nombres.
* 💾 **Persistencia de Nombre:** El apodo del jugador se guarda automáticamente en `localStorage`.

---

## 🎮 Controles del Juego

| Tecla / Acción | Función |
| :--- | :--- |
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> o <kbd>↑</kbd> <kbd>←</kbd> <kbd>↓</kbd> <kbd>→</kbd> | Mover al personaje en 8 direcciones |
| <kbd>Espacio</kbd> | Saltar baldosas y huecos |
| <kbd>Shift</kbd> (Mantener) | Correr / Sprint a alta velocidad |
| <kbd>Enter</kbd> | Abrir / Enviar mensaje en el chat |
| <kbd>Escape</kbd> | Abrir / Cerrar menú de Ajustes |

---

## 🗺️ Mapas y Modos de Juego

El anfitrión (*Host*) puede personalizar la partida en la sala de espera:

1. 🌍 **Clásico (*Classic*):** Plataforma hexagonal equilibrada con radio estándar.
2. 🗼 **La Torre (*The Tower*):** Espacios reducidos y mayor número de pisos, premiando la agilidad vertical.
3. ⏳ **Embudo (*Hourglass*):** Los pisos inferiores se vuelven progresivamente más estrechos, aumentando la adrenalina en los niveles finales.
4. 🔢 **Selector de Pisos:** Configurable desde **1 hasta 5 pisos** independientes.

---

## 🤖 Skins y Personalización

Elige tu identidad visual en el lobby:

* 🤖 **Robot:** Modelo cibernético con visor LED dinámico.
* 🥷 **Ninja:** Traje sigiloso con máscara y cinta ondeante.
* 🧑‍🚀 **Astronauta (*Astro*):** Casco espacial con reflejos holográficos.
* 👽 **Alien:** Ojos expresivos y antenas alienígenas.
* 🎨 **Paleta de Colores Neón:** Elige el color distintivo de tu traje, estela y estandarte.

---

## 💤 Sistema Inteligente de Inactividad (AFK)

Diseñado para garantizar partidas justas y fluidas:

1. **Detección Automática:** Si un jugador no interactúa durante **20 segundos** o minimiza su pestaña, se marca con la insignia **`💤 AFK`** en 3D y en la tabla de posiciones.
2. **Requisito de Inicio:** Para iniciar la partida o siguiente ronda se requieren **mínimo 2 jugadores activos** ($\text{activePlayers} \ge 2$).
3. **Cancelación en Cuenta Regresiva:** Si alguien se ausenta durante los 5 segundos de cuenta atrás, el inicio se cancela y se regresa al Lobby.
4. **Auto-Kick tras 60 Segundos:** Si un jugador permanece inactivo más de 60 segundos en el Lobby, es devuelto automáticamente al menú principal para liberar la sala.

---

## 💬 Chat Multijugador en Tiempo Real

* 🪟 **Interfaz Liquid Glass:** Dock flotante en la esquina inferior izquierda con diseño translúcido.
* 💭 **Burbujas 3D de Cómic:** Las frases enviadas aparecen flotando sobre el modelo 3D del jugador durante 4.5 segundos con animación de entrada y flecha indicadora.
* 😀 **Botonera de Emojis Rápidos:** Envía reacciones instantáneas (`🔥`, `💀`, `👑`, `🚀`, `👏`, `😂`, `GG`) con un solo clic.

---

## 🛠️ Arquitectura y Tecnologías

* **Frontend:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Gráficos 3D:** [Three.js](https://threejs.org/) + [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber/) + [@react-three/drei](https://github.com/pmndrs/drei)
* **Motor de Físicas:** [@react-three/rapier](https://github.com/pmndrs/react-three-rapier) (Rapier Physics en WebAssembly)
* **Red y Multijugador:** [PlayroomKit](https://joinplayroom.com/) (WebRTC DataChannels + RPC sincronizados)
* **Estilos y UI:** [Tailwind CSS v4](https://tailwindcss.com/) + Diseños translúcidos Glassmorphism
* **Efectos de Sonido:** Síntesis nativa en tiempo real con Web Audio API (pasos, saltos, caídas y victorias sin dependencias pesadas de audio).

---

## 🚀 Instalación y Ejecución Local

### Prerrequisitos
* [Node.js](https://nodejs.org/) v18 o superior.
* [npm](https://www.npmjs.com/) o [pnpm](https://pnpm.io/).

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/H3ckyDev/hexaguys.git
   cd hexaguys
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador:**
   Ingresa a `http://localhost:5173`. Para probar el multijugador, abre una segunda ventana en modo incógnito o comparte tu enlace local.

5. **Compilar para producción:**
   ```bash
   npm run build
   ```

---

## 📦 Estructura del Proyecto

```
hexaguys/
├── public/                  # Favicon y recursos estáticos
├── src/
│   ├── components/
│   │   ├── CharacterModel.tsx  # Modelos 3D procedurales (Robot, Ninja, Astro, Alien)
│   │   ├── ChatOverlay.tsx     # Chat flotante con emojis y burbujas
│   │   ├── GameScene.tsx       # Escena Canvas Three.js, luces y cámara
│   │   ├── GameUI.tsx          # Menús 2D, ajustes, modales y podio de victoria
│   │   ├── HexGrid.tsx         # Generador de baldosas hexagonales y físicas
│   │   ├── LandingPage.tsx     # Pantalla de bienvenida, unirse y crear sala
│   │   ├── PerformanceHUD.tsx  # Medidor en vivo de FPS y Ping real
│   │   └── PlayerBall.tsx      # Controlador físico de jugador, WASD y etiquetas 3D
│   ├── utils/
│   │   └── sounds.ts           # Sintetizador de audio estéreo Web Audio API
│   ├── App.tsx                 # Lógica de juego, estados de sala y enrutamiento
│   ├── main.tsx                # Punto de entrada de React
│   └── index.css               # Estilos globales y utilidades glassmorphism
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

<div align="center">
  Hecho con ❤️ para partidas multijugador caóticas e inolvidables.
</div>
