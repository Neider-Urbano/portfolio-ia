# Portafolio Interactivo basado en IA

Portafolio profesional donde el visitante puede explorar el perfil de forma tradicional
o conversar con un asistente de IA que responde con datos reales, obtenidos en tiempo
real de MongoDB a través de un servidor MCP (Model Context Protocol).

## 1. Arquitectura y flujo de datos

Hay **tres piezas independientes** que se despliegan por separado:

- **`apps/web`** — Next.js: sitio público, dashboard admin y la ruta `/api/chat` (actúa
  como **cliente MCP** y como cliente de la API de Google Gemini).
- **`apps/mcp-server`** — Node.js/Express: **servidor MCP** que expone las tools
  (`get_profile_info`, `get_experience`, ...) respaldadas por Mongoose. Nunca se expone
  directamente al navegador del visitante — solo `apps/web` le habla, server-to-server,
  con una API key compartida.
- **`packages/models`** — Schemas de Mongoose compartidos entre ambas apps, para que el
  esquema de datos sea una única fuente de verdad.

```mermaid
flowchart LR
    subgraph Visitante[Navegador del visitante]
        UI[Vista tradicional / Chat UI]
    end

    subgraph WebApp[apps/web — Next.js]
        API_CHAT["/api/chat (Route Handler)"]
        API_CRUD["/api/admin/* (CRUD dashboard)"]
        AUTH[NextAuth.js]
        MCPCLIENT[Cliente MCP]
    end

    subgraph LLM[Google Gemini API]
        CLAUDE[Gemini 2.0 Flash]
    end

    subgraph MCPServer[apps/mcp-server — Servidor MCP]
        TOOLS["Tools: get_profile_info, get_experience,\nget_projects, get_skills, get_education,\nget_gallery, get_references"]
    end

    subgraph DB[(MongoDB)]
        MONGO[(Colecciones vía Mongoose)]
    end

    UI -- "1. Pregunta del usuario" --> API_CHAT
    API_CHAT -- "2. mensaje + historial + functionDeclarations" --> CLAUDE
    CLAUDE -- "3. functionCall (ej. get_experience)" --> API_CHAT
    API_CHAT -- "4. callTool() vía MCP (HTTP + API key)" --> MCPCLIENT
    MCPCLIENT -- "5. JSON-RPC sobre HTTP" --> MCPServer
    TOOLS -- "6. Query Mongoose" --> MONGO
    MONGO -- "7. Resultado" --> TOOLS
    TOOLS -- "8. resultado de la tool" --> MCPCLIENT
    MCPCLIENT -- "9. functionResponse" --> CLAUDE
    CLAUDE -- "10. Respuesta final en texto" --> API_CHAT
    API_CHAT -- "11. Streaming SSE: status + respuesta" --> UI
    API_CHAT -. "log de pregunta/respuesta" .-> MONGO

    UI -- "Vista tradicional (SSR) + stats públicas" --> WebApp
    WebApp -- "Lee todas las colecciones + computePortfolioStats()" --> MONGO
    UI -. "page_view (AnalyticsTracker)" .-> WebApp

    ADMIN[Tú, autenticado] --> AUTH
    AUTH --> API_CRUD
    API_CRUD -- "CRUD" --> MONGO
```

**Puntos clave del diseño:**

- El LLM **nunca inventa datos**: el `system prompt` de `/api/chat` le exige usar
  las tools para cualquier afirmación factual sobre el perfil (ver
  `apps/web/src/app/api/chat/route.ts`).
- El bucle agente (`apps/web/src/lib/llm.ts`) va turno a turno: si Gemini pide una tool,
  se ejecuta contra el MCP server y se le devuelve el resultado, hasta que responde con
  texto final (con un límite de turnos como salvaguarda).
- Cada vez que se ejecuta una tool se emite un evento `status` por streaming (SSE), que
  el frontend traduce en indicadores como "Buscando en proyectos...".
- El dashboard admin (`/admin`) lee y escribe Mongoose **directamente** (no pasa por MCP)
  porque es un cliente de confianza y ya está protegido por NextAuth.

## 2. Estructura de carpetas

```
portafolio/
├── package.json                 # workspaces raíz (npm workspaces)
├── packages/
│   └── models/                  # Mongoose schemas compartidos
│       └── src/
│           ├── Profile.ts
│           ├── Experience.ts
│           ├── Education.ts
│           ├── Project.ts
│           ├── Skill.ts
│           ├── GalleryItem.ts
│           ├── Reference.ts
│           ├── ChatLog.ts       # historial de conversaciones (para analíticas/FAQ)
│           ├── AnalyticsEvent.ts
│           ├── AdminUser.ts
│           └── index.ts
├── apps/
│   ├── mcp-server/              # Servidor MCP standalone (Node + Express)
│   │   └── src/
│   │       ├── db.ts
│   │       ├── index.ts         # bootstrap: McpServer + StreamableHTTPServerTransport
│   │       ├── seed.ts          # datos de prueba
│   │       └── tools/
│   │           ├── types.ts
│   │           ├── getProfileInfo.ts
│   │           ├── getExperience.ts
│   │           ├── getEducation.ts
│   │           ├── getProjects.ts
│   │           ├── getSkills.ts
│   │           ├── getGallery.ts
│   │           ├── getReferences.ts
│   │           ├── getPortfolioStats.ts # métricas agregadas (años, cursos, tecnologías...)
│   │           └── index.ts     # registro central de tools
│   └── web/                     # Next.js (App Router)
│       └── src/
│           ├── app/
│           │   ├── page.tsx             # Home pública: vista tradicional COMPLETA
│           │   │                        # (perfil, stats públicas, proyectos, experiencia,
│           │   │                        #  estudios, skills, galería, referencias)
│           │   ├── proyectos/[slug]/page.tsx  # Detalle de un proyecto (dispara project_view)
│           │   ├── chat/page.tsx        # Vista chatbot IA
│           │   ├── admin/
│           │   │   ├── layout.tsx       # sidebar de navegación + logout
│           │   │   ├── page.tsx         # Dashboard: stats del perfil + tráfico/engagement
│           │   │   ├── login/page.tsx
│           │   │   ├── perfil/page.tsx      # form singleton (GET/PUT /api/admin/profile)
│           │   │   ├── proyectos/page.tsx   # AdminCrudPage(resource="projects")
│           │   │   ├── experiencia/page.tsx # AdminCrudPage(resource="experience")
│           │   │   ├── estudios/page.tsx    # AdminCrudPage(resource="education")
│           │   │   ├── skills/page.tsx      # AdminCrudPage(resource="skills")
│           │   │   ├── galeria/page.tsx     # AdminCrudPage(resource="gallery")
│           │   │   └── referencias/page.tsx # AdminCrudPage(resource="references")
│           │   └── api/
│           │       ├── chat/route.ts            # orquesta LLM + MCP (streaming SSE)
│           │       ├── auth/[...nextauth]/route.ts
│           │       ├── analytics/track/route.ts # tracking público (page_view, etc.)
│           │       └── admin/
│           │           ├── profile/route.ts             # GET/PUT (singleton)
│           │           ├── projects/route.ts (+ [id])    # GET/POST/PUT/DELETE
│           │           ├── experience/route.ts (+ [id])
│           │           ├── education/route.ts (+ [id])
│           │           ├── skills/route.ts (+ [id])
│           │           ├── gallery/route.ts (+ [id])
│           │           └── references/route.ts (+ [id])
│           ├── components/
│           │   ├── chat/
│           │   │   ├── ChatWindow.tsx
│           │   │   └── useChat.ts
│           │   ├── admin/
│           │   │   └── AdminCrudPage.tsx    # tabla + form modal genéricos, reusados
│           │   │                            # por las 6 páginas CRUD de arriba
│           │   └── analytics/
│           │       ├── AnalyticsTracker.tsx # dispara "page_view" en cada navegación pública
│           │       └── ProjectViewTracker.tsx # dispara "project_view" en /proyectos/[slug]
│           ├── lib/
│           │   ├── db.ts             # conexión Mongoose cacheada (Next.js)
│           │   ├── auth.ts           # config NextAuth (Credentials + AdminUser)
│           │   ├── require-admin.ts  # helper de sesión compartido por las rutas /api/admin/*
│           │   ├── session.ts        # sessionId de visitante (localStorage), compartido
│           │   │                     # entre el chat y el tracker de analíticas
│           │   ├── mcp-client.ts     # cliente MCP (listTools / callTool)
│           │   └── llm.ts            # bucle agente con Gemini + tools MCP
│           ├── middleware.ts        # protege /admin y /api/admin
│           └── scripts/create-admin.ts
└── .gitignore
```

> Las 6 páginas CRUD del dashboard (`proyectos`, `experiencia`, `estudios`, `skills`,
> `galeria`, `referencias`) son delgadas: solo declaran sus campos (`FieldConfig[]`) y
> columnas, y renderizan `<AdminCrudPage resource="..." fields={...} columns={...} />`.
> Toda la lógica de listar/crear/editar/borrar vive una sola vez en
> `components/admin/AdminCrudPage.tsx`. `Profile` es la excepción: al ser un documento
> único (singleton), tiene su propio formulario en `admin/perfil/page.tsx` en vez de
> pasar por el componente de lista.

## 3. Modelos de datos

Todos los schemas están en `packages/models/src/*.ts`. Resumen:

| Colección        | Propósito                                                                             |
| ---------------- | ------------------------------------------------------------------------------------- |
| `Profile`        | Datos personales, bio, contacto, `aiPersona` (instrucciones de tono para el LLM)      |
| `Experience`     | Historial laboral (empresa, cargo, fechas, tecnologías)                               |
| `Education`      | Estudios formales, certificaciones y cursos                                           |
| `Project`        | Proyectos con imágenes, links, tecnologías, `viewCount`                               |
| `Skill`          | Habilidades técnicas/blandas con nivel de dominio                                     |
| `GalleryItem`    | Fotos con etiquetas                                                                   |
| `Reference`      | Testimonios/referencias profesionales                                                 |
| `ChatLog`        | Cada pregunta/respuesta del chat (para FAQ y auditoría)                               |
| `AnalyticsEvent` | Eventos de analítica: `page_view`, `project_view`, `chat_question`, `resume_download` |
| `AdminUser`      | Credenciales del dashboard (password hasheado con bcrypt)                             |

`packages/models/src/stats.ts` agrega una función (no un schema): `computePortfolioStats()`
calcula "el perfil en números" (años de experiencia, cantidad de proyectos, tecnologías
distintas, cursos/certificaciones, títulos formales, empresas) a partir de las
colecciones de arriba. Es una única fuente de verdad consumida por **tres** lugares:
la home pública, el dashboard admin, y la tool MCP `get_portfolio_stats` — así el
visitante (vista tradicional o chat) y el admin siempre ven el mismo número.

## 4. Tools del servidor MCP

Definidas en `apps/mcp-server/src/tools/`, registradas en `tools/index.ts`:

- `get_profile_info` — datos generales del perfil.
- `get_experience(technology?, limit?)` — experiencia laboral; si se filtra por
  tecnología, calcula además los años totales trabajados con ella.
- `get_education(type?)` — estudios/certificaciones/cursos.
- `get_projects(technology?, featured?, slug?, limit?)` — lista o detalle de proyectos.
- `get_skills(category?, minProficiency?)` — habilidades.
- `get_gallery(tag?, limit?)` — fotos.
- `get_references()` — testimonios publicados.
- `get_portfolio_stats()` — métricas agregadas (años de experiencia, cantidad de
  proyectos, tecnologías distintas, cursos/certificaciones, títulos, empresas). Evita
  que el modelo tenga que contar manualmente los resultados de otras tools cuando
  preguntan algo como "¿cuántos proyectos tienes en total?".

Cada tool: valida sus argumentos con `zod`, consulta Mongoose, y devuelve JSON plano que
el LLM interpreta y redacta en lenguaje natural. La **descripción** de cada tool es lo
que el modelo usa para decidir cuándo invocarla — están escritas pensando en las
preguntas típicas de un visitante.

## 5. Ruta de chat (LLM + MCP)

`apps/web/src/app/api/chat/route.ts`:

1. Valida el body (`sessionId`, `message`, `history`) con `zod`.
2. Construye el `system prompt` con los datos de `Profile` (incluye `aiPersona`) y reglas
   estrictas de "no inventar datos".
3. Llama a `runChatTurn()` (`apps/web/src/lib/llm.ts`), que:
   - obtiene las tools disponibles del MCP server (`listMcpTools`),
   - las registra como `functionDeclarations` de un modelo Gemini (`genAI.getGenerativeModel`),
   - si la respuesta trae `functionCalls()`, ejecuta `callMcpTool()` contra el MCP server
     y devuelve el resultado como `functionResponse` en el siguiente turno del chat,
   - repite hasta obtener texto final (máx. 6 turnos).
4. Cada tool ejecutada se emite como evento `status` por un stream SSE; el texto final se
   emite como evento `final`.
5. Al terminar, persiste `ChatLog` y `AnalyticsEvent` (`type: "chat_question"`) para
   alimentar el módulo de analíticas del dashboard.

## 6. Dashboard admin y analíticas

**Quién ve qué:**

- **Tú (admin, autenticado en `/admin`):** CRUD completo de las 7 colecciones editables
  (`Perfil`, `Experiencia`, `Estudios`, `Proyectos`, `Skills`, `Galería`, `Referencias`) +
  "el perfil en números" + analítica de tráfico/uso del chat (visitas totales, preguntas
  al chat, proyectos más vistos, preguntas frecuentes).
- **Un tercero (visitante, sin login):** la vista tradicional completa en `/` (todas las
  secciones de arriba en modo lectura) **más "el perfil en números"** en la misma
  página — son los mismos datos que ve el admin en esa sección, solo que sin las
  métricas de tráfico interno. El chat en `/chat` puede responder las mismas preguntas
  numéricas vía la tool `get_portfolio_stats`.

**CRUD del dashboard:** cada recurso sigue el mismo patrón — API (`/api/admin/{recurso}`
con GET/POST y `/api/admin/{recurso}/[id]` con PUT/DELETE, protegidas por
`requireAdmin()` + `src/middleware.ts`) y UI (`components/admin/AdminCrudPage.tsx`,
un componente genérico de tabla + formulario modal parametrizado por `FieldConfig[]`).
`Profile` es la única excepción por ser un documento singleton: vive en
`/api/admin/profile` (solo GET/PUT) con un formulario dedicado en `/admin/perfil`.

**Tracking de analíticas:** `components/analytics/AnalyticsTracker.tsx` está montado en
el `layout.tsx` raíz y dispara un evento `page_view` (`POST /api/analytics/track`) en
cada navegación de la vista pública (excluye `/admin/*` para no contar tus propias
visitas gestionando el contenido). Ese mismo `sessionId` de visitante
(`lib/session.ts`, en `localStorage`) se reutiliza en el chat, para poder correlacionar
qué preguntó cada visitante.

**Página de detalle de proyecto** (`/proyectos/[slug]`): cada tarjeta de la sección
"Proyectos" de la home enlaza aquí. Muestra descripción completa, imágenes, tecnologías,
links (`liveUrl`/`repoUrl`) y estado. Al montarse dispara `ProjectViewTracker`, que
registra un evento `project_view` con el `slug` — así `Project.viewCount` y "proyectos
más vistos" en `/admin` reflejan tráfico real de terceros (a diferencia de la tool MCP
`get_projects`, que deliberadamente **no** incrementa `viewCount` cuando el chat consulta
un proyecto, para no mezclar exploraciones del LLM con vistas reales).

## 7. Variables de entorno y despliegue

> **Nota sobre el LLM:** el chat usa la **API de Google Gemini**, no Claude. La
> suscripción de claude.ai (Pro/Max) y la API de Anthropic son productos y facturación
> completamente separados — no hay forma oficial de reutilizar el pago de claude.ai para
> llamadas programáticas. Gemini tiene una capa gratuita generosa para este caso de uso
> (portafolio de bajo tráfico). Si más adelante quieres usar Claude vía API de pago,
> solo hay que reemplazar `apps/web/src/lib/llm.ts` — el resto de la arquitectura (tools
> MCP, streaming SSE, system prompt) no cambia.

### 7.1 Variables de entorno

**`apps/mcp-server/.env`** (ver `.env.example`):

```
PORT=4002
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/portafolio
MCP_API_KEY=<secreto largo y aleatorio>
```

**`apps/web/.env.local`** (ver `.env.example`):

```
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/portafolio
GEMINI_API_KEY=xxxxxxxxxxxxxxxx
GEMINI_MODEL=gemini-2.0-flash
MCP_SERVER_URL=http://localhost:4002/mcp
MCP_API_KEY=<el mismo secreto que en mcp-server>
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generar con: openssl rand -base64 32>
```

Para obtener `GEMINI_API_KEY` (gratis): entra a
[aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) con tu cuenta de
Google, crea una API key nueva y pégala en `apps/web/.env.local`.

### 7.2 Puesta en marcha local, paso a paso

```bash
# 1. Instalar dependencias de todo el monorepo
npm install

# 2. Copiar los .env.example y completar los valores reales
cp apps/mcp-server/.env.example apps/mcp-server/.env
cp apps/web/.env.example apps/web/.env.local

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

Abre `http://localhost:3000` (sitio público), `http://localhost:3000/chat` (chatbot) y
`http://localhost:3000/admin/login` (dashboard).

### 7.3 Despliegue en producción

1. **MongoDB**: crea un cluster en MongoDB Atlas, habilita acceso por IP/VPC peering
   desde donde despliegues el MCP server, y copia el `MONGODB_URI`.
2. **`apps/mcp-server`**: despliega como servicio Node.js persistente (Railway, Render,
   Fly.io, un VPS con PM2, o un contenedor en tu nube preferida). Expón solo el puerto
   necesario y **restringe el acceso** (firewall/VPC) para que únicamente `apps/web`
   pueda llegar a él — la API key es defensa en profundidad, no el único control.
3. **`apps/web`**: despliega en Vercel (recomendado para Next.js) o cualquier host que
   soporte Route Handlers en runtime Node.js (el chat usa `runtime = "nodejs"`, no Edge,
   por el SDK de Anthropic y el cliente MCP). Configura ahí las variables de entorno de
   `6.1`, apuntando `MCP_SERVER_URL` a la URL pública/interna del servidor MCP desplegado.
4. **NextAuth**: en producción, `NEXTAUTH_URL` debe ser el dominio real (`https://...`) y
   `NEXTAUTH_SECRET` un valor distinto al de desarrollo.
5. Corre `create-admin` una vez contra la base de datos de producción para crear tu
   usuario del dashboard.
