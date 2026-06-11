# ⚽ Polla Ganadora · Mundial 2026

Polla (quiniela) para la **fase de grupos del Mundial 2026**. Cada participante
escribe su nombre y predice el marcador de los 72 partidos. A medida que se
juegan, el administrador carga los resultados reales y la tabla de posiciones se
calcula sola.

**No hay que crear cuenta**: solo poner el nombre y diligenciar los marcadores.

## 🏆 Reglas de puntaje

| Acierto | Puntos |
| --- | --- |
| **Marcador exacto** (predices 2-1 y queda 2-1) | **3** |
| **Empate acertado** (predices empate y empatan, aunque el marcador no coincida) | **3** |
| **Acertaste el ganador** pero no el marcador exacto | **1** |
| Fallaste el resultado | **0** |

La lógica está en [`lib/scoring.ts`](lib/scoring.ts).

## ✨ Páginas

- **`/`** — Inicio con las reglas.
- **`/jugar`** — Pones tu nombre y predices los 72 marcadores. Puedes volver a
  editar mientras el partido no tenga resultado cargado.
- **`/tabla`** — Ranking en vivo. Toca un participante para ver su detalle.
- **`/admin`** — Solo el administrador (protegido por PIN): carga los resultados
  reales.

## 🧱 Tecnología

- [Next.js 14](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase](https://supabase.com) (PostgreSQL) para guardar predicciones y resultados
- Despliegue en [Vercel](https://vercel.com)

---

## 🚀 Puesta en marcha

### 1. Crear la base de datos en Supabase

1. Entra a [supabase.com](https://supabase.com) y crea un proyecto (plan gratis).
2. Ve a **SQL Editor → New query**, pega el contenido de
   [`supabase/schema.sql`](supabase/schema.sql) y dale **Run**.
3. Ve a **Project Settings → API** y copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (¡secreta!) → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Variables de entorno

Copia el ejemplo y rellena los valores:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_PIN=elpinquequieras
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` y `ADMIN_PIN` **nunca** llevan el prefijo
> `NEXT_PUBLIC_`: son secretos del servidor.

### 3. Correr localmente

```bash
npm install
npm run dev
```

Abre <http://localhost:3000>.

---

## ☁️ Desplegar en Vercel

```bash
git init
git add .
git commit -m "Polla Ganadora"
git branch -M main
git remote add origin https://github.com/sebasgc0399/PollaGanadora.git
git push -u origin main
```

Luego, en [vercel.com](https://vercel.com):

1. **Add New → Project** e importa el repo `PollaGanadora`.
2. En **Environment Variables** agrega las 4 variables del paso 2
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PIN`).
3. **Deploy**. Vercel detecta Next.js automáticamente.

> Si cambias variables de entorno después del primer deploy, haz **Redeploy**
> para que tomen efecto.

---

## 🛠️ Editar los partidos

Todos los partidos viven en [`lib/matches.ts`](lib/matches.ts). Si la FIFA cambia
una fecha o un cruce, edita ahí. **No cambies los `id` (`m01`…`m72`)** de los
partidos que ya tengan predicciones o resultados guardados, porque la base de
datos los referencia por ese `id`.

## 👮 Uso del panel Admin

1. Entra a `/admin`.
2. Escribe el `ADMIN_PIN`.
3. Llena el marcador real de los partidos jugados y dale **Guardar resultados**.
4. La tabla se actualiza sola. Para **borrar** un resultado, deja ese partido en
   blanco y guarda.

## ℹ️ Notas

- Como no hay cuentas, los participantes se identifican por el **nombre** que
  escriben. Pide a todos usar siempre el mismo nombre para no duplicarse.
- Un partido queda **bloqueado** para editar predicciones en `/jugar` cuando ya
  tiene resultado cargado.
- El fixture proviene del sorteo del 5 de diciembre de 2025 (fuentes: FIFA, ESPN,
  Al Jazeera). Verifica fechas/cruces antes de arrancar la polla.
