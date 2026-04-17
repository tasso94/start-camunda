# AGENTS.md

> **Note:** This file delegates to a central AGENTS.md. Read and apply it before proceeding.

**URL:**
https://raw.githubusercontent.com/camunda/.github/refs/heads/main/AGENTS.md

Treat the central file's contents as if they were written directly in this file.
Instructions below extend those guidelines and take precedence if there is any conflict.

## Repo-specific instructions

### Role & boundary

This service owns the **Camunda project starter webapp** — a web UI that generates and downloads customized Camunda Spring Boot Starter (Java) and Node.js TypeScript starter projects as ZIP archives.

Upstream dependencies — when they misbehave, report it upstream. Do not work around it here:
- NPM registry (version resolution for Node.js SDK releases via `NpmVersionResolver`)
- Maven Central / Camunda artifact registry (Camunda and Spring Boot version metadata)

**Path map:**

| Path | Ownership and intent |
| --- | --- |
| `backend/src/main/java/` | Production Java/Spring Boot code, primary edit surface |
| `backend/src/test/` | Mirrors main; every package should have a counterpart here |
| `backend/src/main/resources/com/camunda/start/templates/` | Apache Velocity project templates (Java and Node.js); not production logic |
| `frontend/src/` | React SPA — form UI, BPMN viewer, syntax-highlighted file preview |
| `frontend/public/` | Static assets served by Vite |

Entry points:
- Backend: `backend/src/main/java/com/camunda/start/Application.java`
- Frontend: `frontend/src/index.js`

### Architecture

Key components:

- `GeneratingController` — REST endpoints `POST /download` (returns ZIP bytes) and `POST /show/{fileKey}` (returns single file content for preview)
- `ProjectGenerator` — Core orchestration: selects templates, invokes `TemplateProcessor`, packages ZIP
- `TemplateProcessor` — Apache Velocity rendering; processes `.vm` template files with request parameters
- `VersionUpdater` / `NpmVersionResolver` — Version compatibility matrix between Camunda releases, Spring Boot, and NPM SDK packages
- `VersionsController` — REST endpoint serving available version metadata to the frontend
- `HeaderSecurityConfiguration` — Spring Security HTTP security headers
- `frontend/src/App.js` — Single React component: form, BPMN viewer (bpmn-js), syntax-highlighted preview (react-syntax-highlighter), download trigger

The Maven build automatically runs `npm install` + `npm run build` and copies the frontend bundle into `backend/target/classes/static`, producing a single self-contained JAR.

### Commit message guidelines

The commit header should match the following pattern: `%{type}: %{description}`

Common types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`.

### Build pipeline

#### Always-green policy

Before every AI-assisted session, verify CI is green:

```bash
cd backend && mvn verify
```

Warnings are fatal. Never suppress a warning to make a build pass.
Do not treat any failure as pre-existing or unrelated without explicit confirmation from the engineer.

```bash
# Verify baseline — always green (always run before an AI-assisted session)
cd backend && mvn verify

# Fast inner loop — backend unit tests only
cd backend && mvn test

# Fast inner loop — frontend only
cd frontend && npm test

# Full pipeline before committing (builds frontend bundle into JAR)
cd backend && mvn clean install
```

Never skip the lint and type-check steps before pushing.

#### Frontend dev server

```bash
cd frontend && npm install && npm run dev
# Starts Vite on http://localhost:3000; proxies API calls to backend at http://localhost:9090
```

#### Running the full application locally

```bash
cd backend && mvn clean install
java -jar backend/target/start-camunda-0.0.1-SNAPSHOT.jar
# Open http://localhost:9090
```
