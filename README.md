# ⚽ Polla Ganadora · Mundial 2026

Polla (quiniela) para **todo el Mundial 2026**: la fase de grupos y la fase
eliminatoria completa (dieciseisavos → final). Cada participante escribe su
nombre + una clave personal y predice el marcador de los **104 partidos**. A
medida que se juegan, el administrador carga los resultados reales y la tabla de
posiciones se calcula sola.

> **Fase eliminatoria:** como los cruces dependen de cómo terminen los grupos,
> esos 32 partidos arrancan con *placeholders* (`1° A`, `3° C/E/F/H/I`,
> `Gana P73`…). El administrador asigna el equipo real de cada llave desde
> `/admin` a medida que se definen; mientras una llave no tenga sus dos equipos,
> no se puede pronosticar.

**Sin cuentas de correo**: solo nombre + clave personal.

## 🏆 Reglas de puntaje

| Acierto | Puntos |
| --- | --- |
| **Marcador exacto** (incluye empates exactos: 1-1 y queda 1-1) | **3** |
| **Acertaste el resultado** (ganador correcto, o empate pero con otro marcador) | **1** |
| Fallaste el resultado | **0** |

Lógica en [`lib/scoring.ts`](lib/scoring.ts).

## 🔒 Seguridad (importante)

Diseñado para que **nadie haga trampa**:

- **Nada se escribe ni se lee desde el navegador directo.** Toda la base está
  cerrada con RLS sin acceso para la clave pública; el acceso ocurre **solo en el
  servidor** (rutas de Next.js) con la `service_role`, que nunca llega al cliente.
- **Clave personal por participante** (guardada con hash `scrypt`, nunca en texto
  plano). Solo tú, con tu clave, puedes ver o editar tus marcadores.
- **Bloqueo por tiempo validado en el servidor**: la edición de un partido se
  cierra **10 minutos antes del pitazo**. No se puede saltar cambiando el reloj
  del navegador ni llamando a la API directo.
- **Fallback del admin**: si el administrador ya cargó el resultado de un partido,
  ese partido queda bloqueado igual (aunque el horario estuviera mal).
- **La tabla solo revela predicciones de partidos ya jugados** — no se pueden
  espiar las apuestas futuras de los demás.

## ✨ Páginas

- **`/`** — Inicio con las reglas.
- **`/jugar`** — Nombre + clave; predices los 104 marcadores (grupos +
  eliminatoria). Editable hasta 10 min antes de cada partido.
- **`/tabla`** — Ranking en vivo. Toca un participante para ver su detalle.
- **`/admin`** — Solo administrador (PIN): carga los resultados reales y asigna
  los equipos de las llaves de la fase eliminatoria.

## 🧱 Tecnología

- [Next.js 14](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase](https://supabase.com) (PostgreSQL) — acceso solo desde el servidor
- Despliegue en [Vercel](https://vercel.com)

---

## 🚀 Puesta en marcha

### 1. Base de datos en Supabase

1. Crea un proyecto (plan gratis) en [supabase.com](https://supabase.com).
2. **SQL Editor → New query**, pega [`supabase/schema.sql`](supabase/schema.sql) y
   dale **Run**. Es seguro re-ejecutarlo; si ya tenías una versión anterior, este
   script **cierra los permisos abiertos** (paso clave de seguridad).
3. **Project Settings → API**, copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role** (¡secreta!) → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_PIN=elpinquequieras
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` y `ADMIN_PIN` **nunca** llevan `NEXT_PUBLIC_`.
> La antigua `anon key` ya no se usa.

### 3. Correr localmente

```bash
npm install
npm run dev
```

Abre <http://localhost:3000>.

---

## ☁️ Desplegar en Vercel

1. `git push` del repo a GitHub.
2. En [vercel.com](https://vercel.com): **Add New → Project**, importa el repo.
3. **Environment Variables**: agrega `NEXT_PUBLIC_SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY` y `ADMIN_PIN`.
4. **Deploy**. (Si cambias variables luego, haz **Redeploy**.)

---

## 🛠️ Editar partidos y horarios

Los 104 partidos y sus horarios están en [`lib/matches.ts`](lib/matches.ts). El
campo `kickoff` es el pitazo inicial en **hora del Este (ET, UTC-04:00 en
junio/julio)**; de ahí se calcula el bloqueo de 10 min antes. Los horarios se
cotejaron entre ESPN y worldcupwiki (best-effort): **verifícalos** y edita si la
FIFA cambia algo. **No cambies los `id` (`m01`…`m104`)** de partidos que ya tengan
datos guardados.

Los partidos de grupos (`m01`–`m72`) llevan equipos fijos. Los de eliminatoria
(`m73`–`m104`) llevan `homeLabel`/`awayLabel` (placeholders del cruce) y sus
equipos reales **no** se editan en este archivo: los asigna el admin desde
`/admin` (se guardan en la tabla `brackets`).

El minuto de cierre se ajusta con `LOCK_MINUTES_BEFORE` en ese mismo archivo.

## 👮 Uso del panel Admin

1. Entra a `/admin`, escribe el `ADMIN_PIN`.
2. Llena el marcador real de los partidos jugados → **Guardar resultados**.
3. La tabla se actualiza sola. Para **borrar** un resultado, deja ese partido en
   blanco y guarda.
4. **Fase eliminatoria**: en la sección de cada ronda, elige el equipo real de
   cada llave en los selectores y dale **Guardar llaves (equipos)**. Recién ahí
   esa llave queda disponible para pronosticar. Los marcadores se cargan igual
   que en grupos.
4. **Solicitudes de clave**: si alguien olvidó su clave, aparece aquí. Al
   **Aprobar**, se borra su clave (sus marcadores se conservan) y la persona
   vuelve a entrar con una clave nueva.

## 🔁 "Olvidé mi clave"

En `/jugar` hay un enlace **¿Olvidaste tu clave?**: el jugador escribe su nombre y
pide un reinicio. El admin lo aprueba en `/admin` → la persona entra de nuevo con
su nombre y una **clave nueva**, y sus predicciones reaparecen (no se pierden).

## ⏱️ Cuenta regresiva

Cada partido editable muestra **"Cierra en 3h 20m"** (se cierra 10 min antes del
pitazo) y se actualiza solo.

## 🔴 Resultados EN VIVO (automáticos)

Los marcadores se traen solos de la **API pública de ESPN** (`fifa.world`):
gratis, **sin API key ni registro**.

- La **Tabla** se autorefresca cada 45s, muestra una sección **EN VIVO** con los
  partidos en curso (marcador + minuto) y calcula **puntos provisionales** que se
  confirman al terminar el partido.
- Cuando un partido **termina**, su marcador final se **guarda solo** en la tabla
  `results`. El **admin siempre puede corregir** un resultado a mano (lo manual
  manda sobre ESPN).
- Mapeo por par de equipos (los códigos de ESPN coinciden con los nuestros), así
  que no depende de zonas horarias.

### Sincronización garantizada (opcional)

La Tabla ya persiste los finales cuando alguien la abre. Si quieres que los
finales se guarden **aunque nadie esté mirando**, configura un cron gratuito que
llame a `/api/sync` (idempotente):

- **cron-job.org** (gratis, recomendado): crea un job cada 30 min a
  `https://TU-APP.vercel.app/api/sync` con header `Authorization: Bearer <CRON_SECRET>`.
- **Supabase pg_cron + pg_net** (gratis): `select cron.schedule(...)` con `net.http_post`.

Define `CRON_SECRET` en Vercel para proteger el endpoint (si no lo defines,
`/api/sync` queda abierto, pero solo guarda marcadores finales reales de ESPN).

> Nota: ESPN es una API **no oficial**; si algún día cambia, la app sigue
> funcionando con la carga manual del admin.

## ℹ️ Notas

- Cada participante se identifica por **nombre + clave**. Si alguien usa un nombre
  que ya existe pero con otra clave, **no puede entrar** (no puede pisar al otro).
- Limitación conocida: no hay límite de intentos de clave (es una polla entre
  amigos). Si quieres más, se puede añadir rate-limiting.

> Si actualizas desde una versión anterior, **vuelve a correr** `supabase/schema.sql`
> (agrega la columna `reset_requested_at` y la tabla `brackets` para la fase
> eliminatoria; es seguro re-ejecutarlo).
