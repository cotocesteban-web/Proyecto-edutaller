# EducaControl — Prompt Maestro de Desarrollo

## 1. Visión General del Proyecto

Desarrollar **Edutaller**, una plataforma web educativa inspirada en el modelo de INTECAP. Permite a usuarios registrarse en cursos técnicos, a profesores gestionar contenido académico y a administradores controlar la plataforma completa.

**Stack tecnológico:**
- **Backend:** Node.js + Fastify
- **Frontend:** React (Vite), HTML5, CSS3
- **Bases de datos:** MySQL (datos relacionales) + MongoDB (logs, progreso)
- **Almacenamiento de archivos:** Supabase Storage
- **Autenticación pública:** Google OAuth (solo para nuevos usuarios/visitantes)
- **Despliegue:** Vercel

---

## 2. Módulos de la Plataforma

### 2.1 Página Principal (Pública)

- Presentación de la academia **Edutaller** con:
  - Misión y Visión
  - Sección "Contáctanos" (a completar después)
- Catálogo de cursos disponibles (cada uno con imagen y botón **"Asignarme al curso"**):
  1. Mecánica Automotriz
  2. Electricidad
  3. Carpintería
  4. Soldadura Eléctrica
- Botón **"Ingresar"** con tres opciones:
  - Ingresar como Administrador
  - Ingresar como Instructor
  - Ingresar como Estudiante

### 2.2 Registro de Nuevos Usuarios (Google OAuth)

- El visitante hace clic en **"Asignarme al curso"**.
- Se autentica con su cuenta de Google.
- Completa un formulario con:
  - Nombre completo
  - Correo electrónico (prellenado desde Google)
  - Número de teléfono
  - Dirección
  - Curso al que desea inscribirse
- Al enviar, la solicitud llega al panel del administrador para su aprobación.
- Tras la aprobación, el administrador crea credenciales (correo + contraseña) para que el usuario ingrese como estudiante.

---

## 3. Roles y Permisos

### 3.1 Administrador

**Acceso:** Botón "Ingresar como Administrador" → login con correo y contraseña.

**Cuentas iniciales:**
| Correo | Contraseña |
|---|---|
| admin1@gmail.com | 123 |
| admin2@gmail.com | 123 |

**Capacidades:**
- CRUD completo de cursos (crear, editar, eliminar)
- Ver y gestionar solicitudes de inscripción de nuevos usuarios
- Crear credenciales de acceso para estudiantes aprobados
- Asignar profesores a cursos (creando su correo institucional y contraseña)
- Ver lista de estudiantes por curso
- Ver boletas de pago enviadas (inscripción y mensualidades)
- Enviar correo de alerta de insolvencia a estudiantes con pagos pendientes

**Profesores iniciales asignados:**
| Correo | Contraseña | Curso |
|---|---|---|
| profesorelectrico@gmail.com | 123 | Electricidad |
| profesorcarpintero@gmail.com | 123 | Carpintería |
| profesormecanico@gmail.com | 123 | Mecánica Automotriz |

---

### 3.2 Instructor / Profesor

**Acceso:** Botón "Ingresar como Instructor" → login con correo institucional y contraseña.

**Capacidades:**
- Acceso únicamente al curso que tiene asignado
- Subir material didáctico (archivos, imágenes, PDFs)
- Crear tareas con fecha de entrega
- Calificar tareas con escala del 1 al 10
- Ver comentarios de sus estudiantes
- Agregar o modificar contenido del curso (sin poder eliminar ni acceder a otros cursos)

---

### 3.3 Estudiante

**Acceso:** Botón "Ingresar como Estudiante" → login con credenciales creadas por el administrador.

**Cuenta inicial:**
| Correo | Contraseña |
|---|---|
| estudiante1@gmail.com | 123 |

**Capacidades:**
- Ver el contenido y material del curso al que está inscrito
- Entregar tareas en las fechas establecidas
- Ver sus calificaciones
- Enviar fotos de boletas de pago (inscripción / mensualidades) → llegan solo a administradores
- Escribir comentarios visibles únicamente para su profesor

---

## 4. Arquitectura Multi-Agente

### Agente 0 — Orquestador (Padre)
Verifica que todas las tareas estén completas y funcionales. Detecta errores y asigna a los agentes correspondientes para resolverlos. Coordina el flujo de trabajo general.

### Agente 1 — Arquitecto
- Diseño del esquema relacional en MySQL (usuarios, roles, inscripciones, pagos)
- Diseño del esquema en MongoDB (logs de actividad, seguimiento de progreso)
- Definición de la estructura de carpetas del repositorio (`backend/` y `frontend/`)

### Agente 2 — Ciberseguridad
- Middleware de validación de tokens de Google Auth (`google-auth-library`)
- Middleware centralizado anti-IDOR (cruzar ID del token con recursos solicitados)
- Sanitización de inputs (prevención de SQLi y NoSQLi)
- Política de cookies seguras (`HttpOnly`, `Secure`, `SameSite=Strict`)
- Validación estricta de archivos subidos (MIME-type, extensión, tamaño < 5 MB)

### Agente 3 — Backend
- Inicializar proyecto Node.js con Fastify en `backend/`
- Rutas y controladores segregados por rol (admin, instructor, estudiante)
- Integración de Supabase Storage para archivos (boletas, material didáctico)
- Tests unitarios para endpoints clave

### Agente 4 — Frontend
- Inicializar proyecto React (Vite) en `frontend/`
- Configurar React Router y estado global
- Componentes: Login con Google, Dashboard por rol, Catálogo de cursos
- Capa de servicios para consumo seguro de la API del backend

---

## 5. Reglas de Desarrollo

- **Cero concatenación SQL:** solo consultas preparadas/parametrizadas.
- **Sanitización NoSQL:** prohibir `$` y `.` en inputs de queries MongoDB.
- **Sin binarios en DB:** toda imagen o PDF se almacena en Supabase Storage.
- **Sin `console.log`** ni código muerto en producción.
- **Sin `.env*`** en el repositorio (usar `.gitignore`).
- **Conventional Commits:** `feat(auth):`, `fix(security):`, `chore(setup):`, etc.
- Correr `npm run lint` y `npm run test` antes de marcar una tarea como finalizada.

---

## 6. Flujo de Trabajo

1. **Planificación:** proponer un plan breve antes de tareas no triviales y esperar aprobación.
2. **Seguridad primero:** el Agente 2 valida diseños y endpoints del Agente 3 antes de finalizar.
3. **Una tarea a la vez** dentro de cada agente.
4. **Verificación:** lint + tests antes de reportar.
5. **Reporte final:** detallar archivos cambiados y decisiones tomadas.
6. **Incertidumbre:** si la confianza es < 80%, preguntar antes de actuar.

---

## 7. Comandos Esenciales yo los ejecutare manualmente solo dame el aviso

| Acción | Comando |
|---|---|
| Desarrollo | `npm run dev` |
| Calidad | `npm run lint` && `npm run test` |
| Producción | `npm run build` && `npm run start` |

## no subas el archivo .env y el gitignore.

### primero lo probaremos localmente y luego lo desplegaremos a vercel

  
