# Migración a producción: Auth + Base de Datos Real

Hoy la app vive 100% en `localStorage` (`atrt_db_v2`) con un selector flotante Coach/Atleta. Este plan reemplaza esa capa por **Lovable Cloud** (Supabase gestionado) con autenticación real, roles, esquema relacional, storage de archivos y todas las interacciones que pediste.

## 1. Habilitar Lovable Cloud

- Activar Lovable Cloud (crea proyecto Supabase y expone las claves al runtime).
- Crear un bucket de Storage `medical-certificates` (privado, con políticas para que cada atleta suba/lea solo el suyo y el coach pueda leer todos).

## 2. Esquema de base de datos

Migraciones SQL con RLS desde el inicio. Tablas en `public`:

- `profiles` (1‑a‑1 con `auth.users`): `id`, `full_name`, `dni`, `birth_date`, `certificate_path`, `certificate_date`, `objectives`, `phone`, `onboarding_complete`, `created_at`. Trigger `handle_new_user` crea la fila al registrarse.
- `user_roles` + enum `app_role` (`coach` | `athlete`) + función `has_role(uuid, app_role)` SECURITY DEFINER (patrón obligatorio anti‑recursión).
- `coach_settings` (singleton por coach): `coach_id`, `whatsapp`, `display_name`.
- `monthly_loads`: `athlete_id`, `month_key` (`YYYY-MM`), `km`, `macro` (enum `General|Pre-competitivo|Competitivo|Transición`). PK compuesta.
- `trainings`: `id`, `athlete_id`, `date`, `session_type`, `microcycle`, `zone`, `ec`, `main`, `vc`, `planned_km`. Unique (`athlete_id`, `date`).
- `reports`: `id`, `athlete_id`, `date`, `km`, `time_min`, `rpe`, `notes`, `links text[]`, `photos text[]` (paths en Storage).
- `races`: `id`, `athlete_id`, `name`, `date`, `distance_km`, `time_sec`, `active`. Trigger garantiza una sola marca activa por atleta.

**Políticas RLS resumidas**: cada atleta CRUD sobre sus propias filas (`auth.uid() = athlete_id`); el coach (vía `has_role(auth.uid(),'coach')`) tiene SELECT/INSERT/UPDATE/DELETE sobre todos. `profiles`: lectura propia + coach lee todos; update solo propio (salvo coach).

**GRANTs**: `authenticated` con SELECT/INSERT/UPDATE/DELETE en cada tabla; `service_role` con ALL; sin acceso `anon`.

## 3. Autenticación y roles

- Página pública `/auth` con tabs **Iniciar sesión** / **Registrarme** (email + contraseña). `signUp` con `emailRedirectTo: window.location.origin`. Toggle "Confirmar email" desactivado por defecto para pruebas rápidas.
- Listener global `onAuthStateChange` en `__root.tsx` (filtrado a `SIGNED_IN/SIGNED_OUT/USER_UPDATED`) que invalida el router.
- Trigger SQL al crear usuario:
  - inserta fila en `profiles`.
  - si `email = 'joa.dolzani42@gmail.com'` → inserta `(user_id, 'coach')` **y además** crea atleta vinculado "Joaquín Dolzani (Coach)" para auto‑planificación; en cualquier otro caso inserta `(user_id, 'athlete')`.
- Layout protegido `src/routes/_authenticated/route.tsx` (`ssr: false`, redirect a `/auth`).
- Gate de onboarding: si `profiles.onboarding_complete = false`, todas las rutas redirigen a `/onboarding` donde el atleta carga Nombre, DNI, Fecha de nacimiento y sube certificado médico (subida a Storage → guarda `certificate_path` + `certificate_date`).

## 4. UI por rol

- **Selector Coach/Atleta superior**: solo se renderiza si `has_role('coach')`. Para atletas queda totalmente oculto; entran directo a su vista.
- **Vista Coach (`role=coach`)**: lista de atletas (incluye "Joaquín Dolzani (Coach)" si el usuario logueado es el coach), ficha con DNI + fecha de nacimiento en cabecera, gráfico mensual, planner CRUD, marcas, reportes y nueva sección **Configuración** (nombre + WhatsApp en `coach_settings`).
- **Vista Atleta**: calendario propio, formulario de reporte, marcas, perfil. El botón de WhatsApp lee `coach_settings.whatsapp` (server fn pública) y arma el mensaje estructurado con `?role=coach&athleteId=<id>&date=<iso>`.
- Persistir el rol activo del coach en URL (`?role=...`) como hoy.

## 5. Funcionalidades específicas (re‑implementadas sobre la BD)

- **Gráfico de carga mensual interactivo**: barras `recharts` clicables, mes activo en estado local; botones de macrociclo escriben `monthly_loads.macro` para `(athlete, month_key)` seleccionado y se reflejan al instante.
- **Planner CRUD (Coach)**: calendario mensual navegable arriba de los casilleros, suma semanal de `planned_km` al costado de cada fila. Click en día vacío → form limpio + "+ Asignar Entrenamiento". Click en día con sesión → form precargado + "💾 Guardar cambios" + "🗑️ Eliminar". Tres campos de texto obligatorios (EC / Bloque / VC) + selects Tipo / Microciclo / Zona / Km.
- **Marcas editables**: tap en cualquier marca abre `EditRaceModal` con campos nombre/fecha/distancia/tiempo + botones Guardar y Eliminar. Al guardar/eliminar una marca activa, se recalcula VAM y tabla R0–R6 leyendo desde el store (ya derivado en `zones()`).
- **Certificado médico**: input `file` en perfil sube a `medical-certificates/<user_id>/cert.<ext>`; el modal "Ver Certificado Médico" del coach genera una signed URL (server fn) y la renderiza.
- **Reportes**: las capturas se suben a `report-photos/<user_id>/...` (segundo bucket privado, mismas reglas).

## 6. Capa de datos en el frontend

- Eliminar `src/lib/atrt-store.ts` (localStorage) y reemplazarlo por:
  - `src/lib/atrt.functions.ts`: `createServerFn` con `requireSupabaseAuth` para todas las lecturas/escrituras (perfil, atletas, entrenamientos, reportes, marcas, cargas, coach settings, signed URLs de Storage).
  - Hooks con TanStack Query (`useQuery` / `useMutation`) y `queryClient.invalidateQueries` tras cada mutación.
  - Pequeño módulo `src/lib/atrt-derive.ts` con los helpers puros que ya tenés (`vam`, `zones`, `paceForZone`, `certStatus`, `fmtTime`, `fmtDateAR`) para reutilizarlos sin localStorage.
- Borrar el selector "DEV" actual y la lógica de `useDB`.

## 7. Datos de prueba

Sin seeds del lado de la app. Para no perder la demo:
- Al detectar el primer login del coach `joa.dolzani42@gmail.com`, una mutación opcional "Cargar datos de demo" puebla su atleta espejo con el historial (320/360/400/420 km, marca 10K 34:26, sesiones de muestra). Queda como botón en Configuración para no ensuciar cuentas reales.

## 8. Verificación

- Build verde, sin imports a `client.server` desde el bundle cliente.
- Smoke test: registro nuevo → onboarding obligatorio → vista atleta sin tabs de rol. Login con `joa.dolzani42@gmail.com` → ve tabs Coach/Atleta, panel de coach, configuración de WhatsApp, planner CRUD, certificados visibles.

## Detalles técnicos (resumen)

- TanStack Start + `createServerFn` con `requireSupabaseAuth`; `attachSupabaseAuth` en `src/start.ts`.
- `supabaseAdmin` solo dentro de handlers que necesiten bypass (p. ej. trigger fallback, signed URLs si hace falta) y siempre vía `await import('@/integrations/supabase/client.server')`.
- Roles en tabla aparte + `has_role()` SECURITY DEFINER. Nunca rol en `profiles`.
- Storage privado + signed URLs cortas (60 s) servidas por server fn.

---

¿Confirmás que avance con este plan tal cual, o querés ajustar algo antes de que empiece (p. ej. dejar el botón de "datos demo" automático en vez de manual, requerir verificación de email, o usar otro email como coach)?
