# 🎙️ Portafolio Interactivo con IA

**Portafolio full-stack propio, con un asistente de IA que responde preguntas sobre mi
perfil usando datos reales — conectado en vivo a mi base de datos a través de
[MCP (Model Context Protocol)](https://modelcontextprotocol.io), el mismo protocolo que
usan herramientas como Claude para hablar con servicios externos.**

No es una plantilla de portafolio con un chatbot pegado encima. El chat, el CV, el blog
curado y el dashboard admin comparten una única fuente de verdad en MongoDB, y todo el
sitio está diseñado para sentirse como una conversación con una IA — no solo la sección
del chat.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![MCP](https://img.shields.io/badge/Model_Context_Protocol-SDK-8A2BE2)](https://modelcontextprotocol.io)
[![Vercel](https://img.shields.io/badge/apps%2Fweb-Vercel-000000?logo=vercel)](https://vercel.com)
[![Render](https://img.shields.io/badge/apps%2Fmcp--server-Render-46E3B7?logo=render)](https://render.com)

## 🔗 Demo en vivo

- **Sitio:** https://portfolio-frontend-dusky-psi.vercel.app
- **Chat con IA:** https://portfolio-frontend-dusky-psi.vercel.app/chat

> Preguntale al chat cosas como *"¿cuántos años de experiencia tenés en Node.js?"* o
> *"¿qué proyectos destacás?"* — no improvisa: cada respuesta factual pasa por una tool
> MCP que consulta MongoDB en tiempo real.

## ✨ Funcionalidades

- 🤖 **Chat con IA basado en datos reales** — nunca inventa: cada afirmación sobre
  experiencia, proyectos o skills pasa por una tool MCP respaldada por MongoDB.
- 🎙️ **Entrada por voz** en el chat, transcrita en el servidor vía Gemini (evita los
  fallos frecuentes del reconocimiento de voz nativo del navegador fuera de EE. UU.).
- 🔁 **Fallback automático entre 3 proveedores de LLM** (Gemini → OpenRouter → Groq) — si
  uno falla o se queda sin cuota, el chat sigue funcionando sin que el visitante lo note.
- ⌨️ **Comandos rápidos** en el chat (`/help` y similares) para respuestas instantáneas
  sin gastar una llamada al LLM.
- 📄 **CV descargable**: página HTML imprimible generada desde los propios datos del
  perfil, más un endpoint público (`GET /api/resume`) que devuelve el perfil completo.
- 📚 **Blogs curados**: lista de lecturas externas relevantes para el perfil profesional,
  con un flujo de curación (una automatización externa vía n8n registra artículos nuevos
  como borrador; el dueño los revisa y publica desde el dashboard).
- 💬 **Contacto**: formulario en modal → email vía Resend + notificación instantánea por
  Telegram, con protección anti-spam (honeypot).
- 📊 **Dashboard admin completo**: CRUD de todo el contenido del sitio, analítica propia
  (tráfico, preguntas frecuentes del chat, proyectos más vistos) + PostHog.
- 🔒 **Seguridad real, no cosmética**: 2FA (TOTP), bloqueo de cuenta por fuerza bruta,
  rate limiting, y una frontera explícita entre lo que puede usar el chat público y lo
  que es solo para el dueño (ver [sección de seguridad](#-seguridad)).
- 🎨 **Diseño propio ("Modo Voz")**: minimalista, guiado por iconos, pensado para que
  todo el sitio —no solo el chat— se sienta como interactuar con un asistente de IA.

## 🧠 Arquitectura

Tres piezas independientes, desplegadas por separado:

- **`apps/web`** (Next.js): sitio público, dashboard admin, y `/api/chat` — actúa como
  **cliente MCP** y como cliente de los tres proveedores de LLM.
- **`apps/mcp-server`** (Node/Express): **servidor MCP** que expone las tools respaldadas
  por Mongoose. Nunca se expone al navegador del visitante — solo `apps/web` le habla,
  server-to-server, con una API key compartida (también acepta `Authorization: Bearer`
  para conectores externos como Claude).
- **`packages/models`**: schemas de Mongoose compartidos entre ambas apps — una única
  fuente de verdad para el esquema de datos.

```mermaid
flowchart LR
    subgraph Visitante[Navegador del visitante]
        UI[Vista tradicional / Chat UI]
    end

    subgraph WebApp[apps/web — Next.js]
        API_CHAT["/api/chat (SSE)"]
        API_CRUD["/api/admin/* (CRUD dashboard)"]
        AUTH["NextAuth + 2FA (TOTP)"]
        MCPCLIENT[Cliente MCP]
    end

    subgraph LLMs[LLMs, con fallback automático]
        GEMINI[1. Gemini]
        OR[2. OpenRouter]
        GROQ[3. Groq]
    end

    subgraph MCPServer[apps/mcp-server — Servidor MCP]
        TOOLS["Tools: get_profile_info, get_experience,\nget_projects, get_blogs, ..."]
        CACHE[(Cache en memoria, 5 min)]
    end

    subgraph DB[(MongoDB)]
        MONGO[(Colecciones vía Mongoose)]
    end

    UI -- "1. Pregunta del visitante" --> API_CHAT
    API_CHAT -- "2. Turno del agente" --> GEMINI
    GEMINI -. "si falla o se agota" .-> OR
    OR -. "si falla también" .-> GROQ
    GEMINI -- "3. tool call (ej. get_experience)" --> MCPCLIENT
    MCPCLIENT -- "4. JSON-RPC sobre HTTP" --> TOOLS
    TOOLS -- "5. Query Mongoose (o cache)" --> MONGO
    TOOLS -.-> CACHE
    MCPCLIENT -- "6. resultado de la tool" --> GEMINI
    GEMINI -- "7. respuesta final en texto" --> API_CHAT
    API_CHAT -- "8. Streaming SSE: status + respuesta" --> UI
    API_CHAT -. "log de pregunta/respuesta" .-> MONGO

    UI -- "Vista tradicional (SSR) + stats públicas" --> WebApp
    WebApp -- "Lee colecciones + computePortfolioStats()" --> MONGO

    ADMIN[Vos, autenticado] --> AUTH
    AUTH --> API_CRUD
    API_CRUD -- "CRUD directo" --> MONGO
```

**Puntos clave del diseño:**

- El LLM **nunca inventa datos**: el `system prompt` de `/api/chat` exige usar las tools
  para cualquier afirmación factual (ver `apps/web/src/app/api/chat/route.ts`).
- El bucle agente (`apps/web/src/lib/llm.ts`) va turno a turno, con un límite de turnos
  como salvaguarda, y prueba los tres proveedores de LLM en orden ante cualquier fallo.
- Cada tool ejecutada emite un evento `status` por streaming (SSE), que el frontend
  traduce en indicadores tipo "Buscando en proyectos...".
- El servidor MCP cachea en memoria el resultado de las tools de lectura por 5 minutos
  (configurable), para no pegarle a MongoDB en preguntas repetidas.
- El dashboard admin lee y escribe Mongoose **directamente** (no pasa por MCP) porque es
  un cliente de confianza, ya protegido por NextAuth.

## 🛠️ Stack tecnológico

| Capa               | Tecnología                                                                 |
| ------------------ | --------------------------------------------------------------------------- |
| Frontend / Backend  | Next.js 14 (App Router), TypeScript, Tailwind CSS                          |
| IA / Chat           | Google Gemini · OpenRouter · Groq (fallback en cadena), MCP SDK             |
| Base de datos       | MongoDB + Mongoose (`packages/models`, schemas compartidos)                 |
| Servidor MCP        | Node.js + Express + `@modelcontextprotocol/sdk`                             |
| Autenticación       | NextAuth (Credentials) + bcrypt + 2FA (TOTP, `otpauth`)                     |
| Notificaciones      | Resend (email), Telegram Bot API                                            |
| Analítica           | Sistema propio (MongoDB) + PostHog                                          |
| Infraestructura     | Vercel (`apps/web`) · Render (`apps/mcp-server`) · MongoDB Atlas            |

## 🔒 Seguridad

Pensado como un sistema real, no como una demo — algunos puntos concretos:

- **Un solo admin**, contraseña con `bcrypt`, sesión JWT acotada a 12h.
- **2FA opcional (TOTP)** desde `/admin/seguridad`: para desactivarlo hace falta el
  código vigente, no alcanza con robar la sesión del navegador.
- **Rate limiting** en memoria en todos los endpoints públicos de escritura (`/api/chat`,
  `/api/contact`, `/api/comments`, `/api/transcribe`) y en el login / 2FA.
- **Bloqueo de cuenta** tras varios intentos de login fallidos seguidos.
- **Sin ReDoS**: los argumentos de las tools que arman un `$regex` de MongoDB (filtros
  por tecnología, tag, etc.) se escapan antes de construir la expresión regular.
- **Frontera explícita entre tools públicas y privadas del MCP server**: `get_full_profile`
  (perfil completo + preferencias privadas) y `create_blog` (escritura) nunca llegan al
  chat público — se filtran del lado del cliente antes de que el LLM sepa que existen,
  no solo se le pide "por las buenas" en el prompt que no las use.
- El servidor MCP **nunca** se expone directo al navegador del visitante.

## 🗂️ Estructura del proyecto

```
portafolio/
├── packages/
│   └── models/                  # Schemas de Mongoose compartidos
│       └── src/
│           ├── Profile.ts / Experience.ts / Education.ts / Project.ts
│           ├── Skill.ts / GalleryItem.ts / Reference.ts / Service.ts
│           ├── Comment.ts / Blog.ts / Preference.ts (privado)
│           ├── ChatLog.ts / AnalyticsEvent.ts / AdminUser.ts
│           ├── resume.ts        # getFullProfile() — agregación del perfil público
│           ├── stats.ts         # computePortfolioStats()
│           └── index.ts
├── apps/
│   ├── mcp-server/               # Servidor MCP standalone (Node + Express)
│   │   └── src/
│   │       ├── index.ts          # bootstrap: McpServer + StreamableHTTPServerTransport
│   │       ├── cache.ts          # cache en memoria de resultados de tools (TTL)
│   │       ├── lib/escapeRegex.ts
│   │       └── tools/            # get_profile_info, get_experience, get_projects,
│   │                              # get_skills, get_education, get_gallery,
│   │                              # get_references, get_services, get_portfolio_stats,
│   │                              # get_blogs, create_blog, get_full_profile
│   └── web/                      # Next.js (App Router)
│       └── src/
│           ├── app/
│           │   ├── page.tsx              # Home pública (vista tradicional completa)
│           │   ├── chat/page.tsx         # Vista chatbot IA
│           │   ├── cv/page.tsx           # CV imprimible (solo accesible desde admin)
│           │   ├── proyectos/[slug]/     # Detalle de proyecto
│           │   ├── admin/                # Dashboard: perfil, experiencia, estudios,
│           │   │                          # proyectos, skills, galería, referencias,
│           │   │                          # servicios, comentarios, blogs,
│           │   │                          # preferencias (privado), seguridad (2FA)
│           │   └── api/
│           │       ├── chat/route.ts             # orquesta LLM + MCP (streaming SSE)
│           │       ├── transcribe/route.ts        # voz → texto vía Gemini
│           │       ├── resume/route.ts            # GET público, perfil completo
│           │       ├── contact/route.ts           # Resend + Telegram
│           │       ├── comments/route.ts
│           │       ├── analytics/track/route.ts
│           │       ├── auth/[...nextauth]/route.ts
│           │       └── admin/                     # CRUD de cada colección + security/2fa/*
│           ├── components/
│           │   ├── chat/         # ChatWindow, useChat, comandos rápidos
│           │   ├── home/         # ContactActions (modal), ResumeLink, secciones
│           │   ├── admin/        # AdminCrudPage genérico (tabla + form modal)
│           │   └── analytics/    # AnalyticsTracker, PostHogPageView
│           ├── lib/
│           │   ├── auth.ts           # NextAuth: password + rate limit + lockout + 2FA
│           │   ├── totp.ts           # helpers TOTP compartidos
│           │   ├── rate-limit.ts     # limitador en memoria por IP
│           │   ├── llm.ts            # bucle agente: Gemini → OpenRouter → Groq
│           │   ├── mcp-client.ts     # cliente MCP (listTools / callTool)
│           │   ├── notify.ts         # Resend + Telegram
│           │   ├── posthog-client.ts
│           │   └── require-admin.ts  # guard de sesión para /api/admin/*
│           └── middleware.ts         # protege /admin y /api/admin
└── package.json                  # workspaces raíz (npm workspaces)
```

## 🧩 Modelos de datos

Todos los schemas están en `packages/models/src/*.ts`:

| Colección        | Propósito                                                                        |
| ----------------- | --------------------------------------------------------------------------------- |
| `Profile`         | Datos personales, bio, contacto, idiomas, `aiPersona` (tono para el LLM)         |
| `Experience`      | Historial laboral (empresa, cargo, fechas, tecnologías)                          |
| `Education`       | Estudios formales, certificaciones y cursos                                      |
| `Project`         | Proyectos con imágenes, links, tecnologías, `viewCount`                          |
| `Skill`           | Habilidades técnicas/blandas con nivel de dominio                                |
| `GalleryItem`     | Fotos con etiquetas                                                              |
| `Reference`       | Testimonios/referencias profesionales                                            |
| `Service`         | Servicios profesionales ofrecidos                                                |
| `Comment`         | Comentarios de visitantes (moderados antes de publicarse)                        |
| `Blog`            | Lecturas externas curadas, con flujo de revisión (`reviewed`)                    |
| `Preference`      | **Privado** — equipos, música, comida, estado civil, salario esperado, etc.       |
| `ChatLog`         | Historial de preguntas/respuestas del chat (FAQ y auditoría)                     |
| `AnalyticsEvent`  | `page_view`, `project_view`, `chat_question`, `resume_download`, `contact_message`|
| `AdminUser`       | Credenciales del dashboard (bcrypt) + estado de 2FA (TOTP)                        |

## 🔌 Tools del servidor MCP

| Tool                  | Qué hace                                                             | ¿Chat público? |
| ---------------------- | ---------------------------------------------------------------------- | :-------------: |
| `get_profile_info`     | Datos generales del perfil (bio, contacto, hobbies, idiomas)          | ✅               |
| `get_experience`       | Historial laboral, con años totales por tecnología                    | ✅               |
| `get_education`        | Estudios, certificaciones y cursos                                    | ✅               |
| `get_projects`         | Lista o detalle de proyectos, con filtros                             | ✅               |
| `get_skills`           | Habilidades técnicas/blandas                                          | ✅               |
| `get_gallery`          | Fotos de eventos, charlas, etc.                                       | ✅               |
| `get_references`       | Testimonios publicados                                                | ✅               |
| `get_services`         | Servicios profesionales ofrecidos                                     | ✅               |
| `get_portfolio_stats`  | Métricas agregadas ("el perfil en números")                           | ✅               |
| `get_blogs`            | Lecturas curadas ya revisadas                                         | ✅               |
| `get_full_profile`     | Perfil completo en una sola llamada + preferencias privadas           | ❌ solo integraciones propias (Claude, n8n) |
| `create_blog`          | Registra un artículo nuevo como borrador (`reviewed: false`)          | ❌ solo automatización n8n |

## 🚀 Cómo correrlo en local

```bash
# 1. Instalar dependencias de todo el monorepo
npm install

# 2. Copiar los .env.example y completar los valores reales
cp apps/mcp-server/.env.example apps/mcp-server/.env
cp apps/web/.env.example apps/web/.env

# 3. Compilar el paquete de modelos compartidos
npm run build:models

# 4. (Opcional) Poblar datos de prueba
npm run seed

# 5. Crear tu usuario admin del dashboard
EMAIL=tu@email.com PASSWORD=unaClaveSegura npm run create-admin --workspace=apps/web

# 6. Levantar el servidor MCP (terminal 1)
npm run dev:mcp

# 7. Levantar Next.js (terminal 2)
npm run dev:web
```

Abrí `http://localhost:3000` (sitio público), `http://localhost:3000/chat` (chatbot) y
`http://localhost:3000/admin/login` (dashboard).

Todas las variables de entorno, con explicación de dónde conseguir cada key, están
documentadas en `apps/web/.env.example` y `apps/mcp-server/.env.example`. Casi todo salvo
`MONGODB_URI`, `GEMINI_API_KEY` y `MCP_API_KEY`/`MCP_SERVER_URL` es opcional — el sitio
funciona igual sin Resend, Telegram, PostHog o los proveedores de LLM de respaldo, solo
con menos funcionalidades.

> **Nota sobre el LLM:** el chat usa las **APIs** de Google Gemini / OpenRouter / Groq,
> no la suscripción de claude.ai. Son productos y facturación completamente separados.

## ☁️ Despliegue

- **`apps/mcp-server`**: servicio Node.js persistente (acá corre en Render) — necesita
  ser un proceso de larga vida, no serverless, porque el rate limiter y el cache de
  tools viven en memoria. Restringí el acceso de red a que solo `apps/web` pueda
  llegarle; la API key es defensa en profundidad, no el único control.
- **`apps/web`**: Vercel (Route Handlers en runtime Node.js, no Edge — lo necesitan los
  SDKs de IA y el cliente MCP).
- **MongoDB**: Atlas.

## 👤 Autor

**Neider Julian Urbano Bastilla** — Ingeniero de Sistemas, Full Stack (IA & MERN).
