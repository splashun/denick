# Denick

A lightweight Hypixel nickname lookup API built with Express and PostgreSQL. BYODB 🤢

---

## Quick Start
why would you want to run this urself lol

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file in your root dir:
```env
PORT=8080
DATABASE_URL=postgresql://user:password@localhost:5432/denick
```
^port is optional
### 3. Run Database Migrations
Set up database tables, indexes, triggers:
```bash
node migrate.js
```

### 4. Start the Server
```bash
# Development (watch mode)
npm run dev

# Prod(uction)
npm start
```

---

## Current API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/denick/:nick` | Lookup real player name and UUID by nickname |
| `GET` | `/health` | Health check (checks DB connection) |
| `GET` | `/` | API status check |

### Example Response (`GET /denick/thealfie381`)
```json
{
  "nick": "thealfie381",
  "realName": "unsplash",
  "realUuid": "47602aa7-ea3f-48b2-ab51-8411d4a75cee"
}
```

---

## Other

```bash
# Run tests
npm test

# Syntax verification
npm run lint
```
