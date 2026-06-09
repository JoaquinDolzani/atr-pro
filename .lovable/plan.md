
## Plan — Estabilización y nuevas funciones

### 1) Migración SQL (un solo paso)
- `profiles`: agregar `is_active boolean NOT NULL DEFAULT true` y `avatar_path text`.
- Nueva tabla `payments(athlete_id, month_key, paid bool, paid_at, note)` con PK compuesta. RLS: el atleta lee los suyos; el coach lee/escribe todo.
- Nuevo bucket privado `avatars` con policies RLS para que cada usuario gestione `userId/...`, y lectura propia + del coach.
- Función `recalc_monthly_km(athlete, month)` + triggers en `trainings` (INSERT/UPDATE/DELETE) y `reports` (INSERT/UPDATE/DELETE) que recalculan `monthly_loads.km` automáticamente (suma `planned_km` cuando no hay `reports`, prioriza `reports.km` si existen). Mantiene las barras del gráfico, totales semanales/mensuales y macrociclos en sync sin lógica del cliente.

### 2) Bug del calendario (CRASH al asignar entrenamiento)
- En `upsertTraining` de `atrt-data.ts`: enviar **solo campos no vacíos** y forzar tipos correctos (`planned_km` como número, enums normalizados). Quitar valores `undefined`. Cualquier excepción de la mutación se traga con `try/catch` y muestra un mensaje en el formulario en vez de bubbling.
- **ErrorBoundary** real en `__root.tsx` envolviendo `<Outlet />` para que un error de render no muestre la pantalla en blanco.
- Crash secundario: el `Bar onClick` de Recharts pasa un objeto cuyo `key` puede ser undefined; usar `payload.key`.

### 3) Encabezado del calendario dinámico
- Re-render del label del mes con `key={viewMonth.getTime()}` y `Intl.DateTimeFormat` (más fiable que `toLocaleDateString` para Workers/SSR). Aplica a CoachView y AthleteView.

### 4) WhatsApp del coach se pierde
- `useCoachSettingsMutation` ya hace upsert con `coach_id` como conflict target pero falta la constraint UNIQUE (existe como PK, OK). El problema real: la query `useCoachSettings` filtra por el primer rol `coach`, no por el `coach_id` que se está guardando. Se simplifica leyendo siempre el coach actual desde la tabla `coach_settings` (cualquier registro) — ya está bien, pero el invalidate no refresca la consulta del atleta porque la query corre en `useEffect` del modal. Forzar `refetchOnWindowFocus: true` y disparar invalidate global del key `coach-settings`.
- En `SettingsModal`, recargar valor cuando se reabre el modal.

### 5) Foto de perfil del atleta
- Nuevo selector de foto en `ProfileTab` que sube a bucket `avatars` (`uploadAvatar`) y guarda `avatar_path` en `profiles`. Mostrar avatar con signed URL (1 h) reemplazando el icono `<User>`.

### 6) Recalculo automático de kilómetros
- Implementado por triggers SQL (ver 1). El frontend solo invalida queries tras `upsertTraining` / `upsertReport` y todo se refresca: gráfico, semana, mes, macrociclos y el resumen de cada corredor en la lista del coach.

### 7) Módulo "Gestión de Pagos" (Coach)
- Nueva sección colapsable dentro de `AthleteCard`: lista los últimos 6 meses, cada uno con switch "Pagado / Pendiente" que persiste en `payments`. Etiqueta destacada arriba de la ficha si hay meses adeudados.
- En la lista general de atletas, badge naranja "Adeuda" si el mes actual está sin pagar.

### 8) Suspensión / activación de atletas
- En `AthleteCard` (Coach): badge "Estado: Activo" (verde) o "Estado: Suspendido" (rojo). Botón naranja "Suspender Acceso" o verde "Reactivar Atleta" según estado, persistiendo `is_active`.
- En `auth.tsx`: tras `signInWithPassword`, leer `profiles.is_active` del usuario. Si es `false`, `supabase.auth.signOut()` y mostrar:
  *"Tu cuenta se encuentra suspendida. Por favor, comunícate con tu entrenador Joaquín Dolzani para reactivarla."*
- En `routes/index.tsx`: chequeo en runtime — si `profile.is_active === false`, signOut + redirect a `/auth?suspended=1`. Esto bloquea sesiones ya abiertas cuando el coach suspende en tiempo real (en el próximo refetch de profile, que `react-query` corre al cambiar de tab/foco).

### 9) Detalles técnicos
- `signedCertUrl` y nuevo `signedAvatarUrl`: 1 h.
- Mantener `useAuth` ampliado con `isActive` y forzar redirect en `Index` si pasa a `false`.
- Sin cambios en rutas/server-fns: todo client-side con Supabase + RLS.

Espero tu OK para ejecutar la migración y aplicar los cambios.
