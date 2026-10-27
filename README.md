# CoSpace

CoSpace es una plataforma full-stack para la gestión y reserva por horas de espacios de coworking (escritorios, salas de reuniones y cabinas). Los usuarios se registran, exploran el catálogo y reservan; los administradores gestionan los espacios. La interfaz usa un modo claro con una paleta en tonos verde pastel y está disponible en español e inglés.

**Aplicación desplegada:** <URL-DE-VERCEL>

---

## Tecnologías

| Área | Herramienta |
|---|---|
| Framework | Next.js 16 (App Router), React Server Components y `<Suspense>` |
| Lenguaje | TypeScript (sin `any`) |
| Base de datos | PostgreSQL en Supabase |
| ORM | Prisma (migraciones y seed) |
| Autenticación | JWT firmado con `jose`, contraseñas con `bcryptjs`, cookies `httpOnly` |
| Protección de rutas | `src/proxy.ts` (sesión y rol), más validación propia en cada route handler |
| Validación | Zod |
| Estilos | Tailwind CSS (modo claro, verde pastel) |
| Internacionalización | Español e inglés con selector de idioma |
| Contenedores | Docker |

---

## Requisitos previos

- **Node.js** 20 o superior
- **npm** (incluido con Node.js)
- **Git**
- Una cuenta gratuita en **Supabase** con un proyecto creado
- **Docker** (solo si quieres ejecutar con contenedor)

---

## Variables de entorno

Copia `.env.example` a `.env` y completa cada variable:

| Variable | Para qué sirve | Valor y cómo obtenerlo |
|---|---|---|
| `DATABASE_URL` | Conexión de la aplicación a la base de datos (con pooler) | En Supabase: **Project Settings → Database → Connection string → Transaction pooler** (puerto `6543`). Reemplaza `[YOUR-PASSWORD]` por la contraseña de tu base y agrega `?pgbouncer=true` al final |
| `DIRECT_URL` | Conexión directa, usada por Prisma para las migraciones | En el mismo lugar, copia **Direct connection** (puerto `5432`) |
| `JWT_ACCESS_SECRET` | Secreto con el que se firma el access token | Cadena aleatoria larga. Genérala con el comando de abajo |
| `JWT_REFRESH_SECRET` | Secreto con el que se firma el refresh token | Otra cadena aleatoria, distinta de la anterior |
| `ACCESS_TOKEN_EXPIRES_IN` | Duración del access token | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | Duración del refresh token | `7d` |

Para generar un secreto:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ejecútalo dos veces: un resultado para cada secreto.

---

## Ejecución en desarrollo

Ejecuta estos comandos en orden:

```bash
# 1. Clonar el repositorio e instalar dependencias
git clone <URL-DEL-REPOSITORIO>
cd <NOMBRE-DE-LA-CARPETA>
npm install

# 2. Crear el archivo .env y completarlo (ver sección anterior)
cp .env.example .env

# 3. Ejecutar las migraciones
npx prisma migrate deploy

# 4. Ejecutar el seed (crea el administrador y los espacios de ejemplo)
npx prisma db seed

# 5. Levantar el proyecto en modo desarrollo
npm run dev
```

La aplicación queda disponible en http://localhost:3000.

> Si vas a modificar el modelo de datos durante el desarrollo, usa `npx prisma migrate dev` en lugar de `migrate deploy`.

---

## Credenciales de prueba

**Administrador** (creado por el seed):

| Campo | Valor |
|---|---|
| Correo | `admin@cospace.com` |
| Contraseña | `AdminPassword123!!` |

Con esta cuenta se accede al panel `/admin` para crear, editar y desactivar espacios.

**Usuario regular:** el rol de administrador no se puede crear desde el registro público. Para probar como cliente, crea una cuenta en `/register` y luego usa `/spaces` y `/dashboard`.

---

## Ejecución con Docker

```bash
# Construir la imagen
docker build -t cospace .

# Ejecutar el contenedor pasando las variables de entorno desde el archivo .env
docker run -p 3000:3000 --env-file .env cospace
```

La aplicación queda disponible en http://localhost:3000. Las variables de entorno **no** se incluyen en la imagen: se entregan al contenedor al ejecutarlo con `--env-file`.

---

## Scripts disponibles

> Verifica que esta tabla coincida con tu `package.json`.

| Script | Qué hace |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Genera el build de producción |
| `npm run start` | Inicia la aplicación ya compilada |
| `npm run lint` | Revisa el código con ESLint |
| `npx prisma migrate dev` | Crea y aplica migraciones en desarrollo |
| `npx prisma migrate deploy` | Aplica las migraciones existentes |
| `npx prisma db seed` | Carga el administrador y los espacios de ejemplo |
| `npx prisma studio` | Abre una interfaz web para ver la base de datos |

---

## Reglas de negocio

**Espacios**
- El catálogo público se renderiza en el servidor (SSR) y solo muestra espacios activos.
- Los espacios no se eliminan: el administrador los desactiva (eliminación lógica).
- No se puede desactivar un espacio con reservas futuras confirmadas.

**Reservas** (`/api/bookings`)
- Duración de 1 a 4 horas, en horas completas, entre las 7:00 y las 21:00 hora de Colombia.
- No se puede reservar en el pasado ni con más de 30 días de anticipación.
- Un espacio no admite reservas confirmadas solapadas; terminar a las 12:00 y empezar a las 12:00 es válido.
- Un usuario no puede tener reservas confirmadas solapadas, ni siquiera en espacios distintos.
- Máximo 3 reservas futuras confirmadas por usuario.
- Los solapes y el límite se validan dentro de una transacción de Prisma (`$transaction`).
- El precio total lo calcula el servidor (horas × precio por hora).
- El usuario puede cancelar hasta 2 horas antes del inicio; el administrador puede cancelar en cualquier momento. La reserva cancelada se conserva con estado `CANCELLED`.
- Un usuario no puede ver ni modificar reservas de otro, aunque cambie el id en la URL.

---

## Autenticación y seguridad

- Contraseñas almacenadas con hash (`bcryptjs`).
- Access token y refresh token viajan solo en cookies `httpOnly`, `secure` y `sameSite`; nunca en el body ni en `localStorage`.
- El refresh token se guarda hasheado en la base de datos y el logout lo revoca.
- `/api/auth/refresh` renueva la sesión sin que el usuario vuelva a iniciar sesión.
- `src/proxy.ts` redirige al login a quien no tenga sesión y bloquea las rutas de admin a quien no sea administrador. Además, cada route handler valida sesión y rol por su cuenta.
- Todos los errores responden con el mismo formato y códigos HTTP correctos (400, 401, 403, 404, 409).

---

## Experiencia de usuario

- Después de iniciar sesión se redirige a `/spaces`.
- El navbar cambia según la sesión: para usuarios autenticados no muestra el enlace "Inicio".
- Las vistas protegidas (`/dashboard` y `/admin`) incluyen el botón **Volver a Espacios**.
- Selector de idioma (español / inglés) siempre visible.

---

## Estructura de carpetas

> Ajusta este árbol a tu proyecto final.

```
├── prisma/
│   ├── migrations/        # Migraciones de la base de datos
│   ├── schema.prisma      # Modelo: User, RefreshToken, Space, Booking
│   └── seed.ts            # Administrador y espacios de ejemplo
├── public/                # Archivos estáticos e imágenes
├── messages/              # Textos de i18n (es.json, en.json)
├── src/
│   ├── proxy.ts           # Protección de rutas privadas y de admin
│   ├── app/
│   │   ├── (public)/      # Home, catálogo y detalle de espacios
│   │   ├── (auth)/        # Login y registro
│   │   ├── (private)/     # Dashboard del usuario (mis reservas)
│   │   ├── (admin)/       # Panel de administración
│   │   └── api/           # Route handlers: auth, spaces, bookings
│   ├── components/        # Componentes reutilizables (ui, forms, common)
│   ├── lib/               # Prisma, autenticación, errores y validaciones (Zod)
│   ├── services/          # Reglas de negocio y consultas a la base de datos
│   └── types/             # Tipos de TypeScript
├── .env.example           # Plantilla de variables de entorno
├── Dockerfile             # Imagen para construir y ejecutar la aplicación
└── README.md
```

---

## Despliegue

- **Base de datos:** Supabase (PostgreSQL).
- **Aplicación:** Vercel. En el proyecto de Vercel se configuran las mismas variables de entorno del `.env.example`.
- **Build:** `npm run build`.

**URL desplegada:** <URL-DE-VERCEL>