# Pubblicazione

Backend su **Render**, frontend su **Netlify**, database e storage su **Supabase**.
Entrambe le piattaforme partono dallo stesso repository, puntando a cartelle diverse.

L'ordine conta: il frontend ha bisogno dell'URL del backend, e il backend ha
bisogno dell'URL del frontend. Si risolve pubblicando il backend per primo e
completando la sua configurazione alla fine.

---

## 1. Supabase

Deve esistere prima di tutto il resto.

- Tabelle: `users`, `projects`, `schemas`, `shapes`, `connections`
- Bucket storage `images`, **pubblico** (le immagini delle forme sono servite
  tramite URL pubblico da `getPublicUrl`)
- Eseguire `backend/migrations/001_blueprint_nodes.sql` se non già fatto

Servono `SUPABASE_URL` e `SUPABASE_ANON_KEY` da *Project Settings → API*.

---

## 2. Backend su Render

**New → Web Service**, collegato al repository.

| Campo | Valore |
| --- | --- |
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

In alternativa si può usare `render.yaml` in radice tramite **New → Blueprint**:
contiene già questi valori.

### Variabili d'ambiente

| Variabile | Valore |
| --- | --- |
| `SUPABASE_URL` | dal pannello Supabase |
| `SUPABASE_ANON_KEY` | dal pannello Supabase |
| `JWT_SECRET` | stringa lunga e casuale |
| `CORS_ORIGIN` | da compilare al passo 4 |

**Non impostare `PORT`**: la fornisce Render, e il codice la legge da lì.

Cambiare `JWT_SECRET` invalida tutte le sessioni esistenti.

Al termine si ottiene un URL tipo `https://schemaroid-api.onrender.com`.
Verificarlo aprendo `/health`: deve rispondere `{"status":"ok"}`.

---

## 3. Frontend su Netlify

**Add new site → Import an existing project**, stesso repository.

La configurazione è già in `netlify.toml` (base `frontend`, publish `dist`,
redirect SPA). Non serve compilare i campi a mano.

### Variabile d'ambiente

| Variabile | Valore |
| --- | --- |
| `VITE_API_URL` | l'URL del backend, es. `https://schemaroid-api.onrender.com` |

Il suffisso `/api` viene aggiunto automaticamente se assente, quindi entrambe
le forme funzionano.

Le variabili `VITE_*` finiscono **nel bundle scaricato dal browser**: non vanno
mai usate per chiavi segrete.

---

## 4. Chiudere il cerchio

Tornare su Render e impostare `CORS_ORIGIN` con l'URL esatto di Netlify,
senza barra finale:

```
CORS_ORIGIN=https://schemaroid.netlify.app
```

Finché resta vuota il backend accetta richieste da qualsiasi origine: comodo in
locale, da evitare in produzione.

Più origini si separano con virgole (utile per aggiungere un dominio
personalizzato accanto a quello Netlify).

---

## 5. Dopo la messa online

Sostituire il dominio segnaposto `https://schemaroid.netlify.app` in:

- `frontend/index.html` — `canonical`, `og:url`, `og:image`
- `frontend/public/robots.txt`
- `frontend/public/sitemap.xml`

`og:image` punta a `/social-card.png`, immagine **non ancora presente**:
va aggiunta in `frontend/public/` (1200×630) oppure il tag va rimosso.

Per Google Search Console: verificare la proprietà e inviare
`https://<dominio>/sitemap.xml`.

---

## Note sul piano gratuito

Il servizio Render gratuito **si sospende dopo circa 15 minuti di inattività**.
La prima richiesta successiva richiede parecchi secondi: login e caricamento
iniziale sembreranno bloccati. È un limite del piano, non un difetto dell'app.

---

## Sviluppo in locale

Il comportamento resta invariato: senza `VITE_API_URL` il frontend usa `/api`,
che il proxy di Vite inoltra a `localhost:5000`.

```
cd backend  && npm install && npm run dev
cd frontend && npm install && npm run dev
```

Il backend richiede un file `backend/.env` con `SUPABASE_URL`,
`SUPABASE_ANON_KEY` e `JWT_SECRET`.
