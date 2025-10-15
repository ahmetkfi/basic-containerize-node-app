# Notes REST API

Monorepo that demonstrates a simple notes application composed of two Express/MongoDB microservices and an NGINX reverse proxy. Everything is orchestrated via Docker Compose so you can spin up the entire stack with a single command.

- `notebooks-backend`: CRUD API for managing notebooks.
- `notes-backend`: CRUD API for notes, including optional validation that a note belongs to an existing notebook.
- `reverse-proxy`: NGINX gateway that exposes both APIs under a shared `http://localhost:8080` entrypoint.

## Project Layout

- `compose.yaml` / `compose.override.yaml` – root-level Compose definition that includes the service-specific Compose files and wires the shared network and reverse proxy.
- `notebooks-backend/` – Node.js API, MongoDB container, and initialization script for notebook data.
- `notes-backend/` – Node.js API, MongoDB container, and initialization script for note data.
- `reverse-proxy/nginx.conf` – Routes `/api/notebooks` to the notebooks API and `/api/notes` to the notes API.

## Prerequisites

- Docker Engine and Docker Compose v2.20+ (Compose v2.24 or newer recommended for the `include` directive used in the root file).
- No external services are required; MongoDB instances are started inside the Compose project.

## Configuration

Each backend folder ships with a `.env` file that provides credentials for its MongoDB user:

- `notebooks-backend/.env` – defines `NOTEBOOKS_DB_*` variables.
- `notes-backend/.env` – defines `NOTES_DB_*` variables.

These variables are consumed by the MongoDB initialization scripts located in each `db-config/mongo-init.js`. Adjust the values if you want to use different usernames/passwords.

The notes service also expects a `NOTEBOOKS_API_URL` so it can validate notebook references. The default override (`compose.override.yaml`) sets this to `http://notebooks/api/notebooks`, which resolves to the notebooks service on the internal Docker network.

## Start the Stack

From the repository root:

```bash
docker compose up --build
```

This command:

1. Builds the `notes` and `notebooks` service images using the `development` stage defined in each Dockerfile (hot-reloading via `nodemon` with source code mounted from the host).
2. Starts dedicated MongoDB containers and seeds each database user via the bundled init scripts.
3. Launches the reverse proxy that publishes the APIs at `http://localhost:8080`.

When the containers are ready you can exercise the APIs, for example:

```bash
# Create a notebook
curl -X POST http://localhost:8080/api/notebooks \
  -H "Content-Type: application/json" \
  -d '{"name":"Personal","description":"Personal notes"}'

# List all notes
curl http://localhost:8080/api/notes
```

Stop and remove the containers (while keeping volumes) with:

```bash
docker compose down
```

To wipe MongoDB data as well, add `--volumes`.

## API Overview

All endpoints return JSON with a top-level `data` property on success and meaningful HTTP status codes on error.

- **Notebooks API (`/api/notebooks`)**
  - `POST /` – create a notebook (`name` required, `description` optional).
  - `GET /` – list notebooks.
  - `GET /:id` – fetch a single notebook by MongoDB ObjectId.
  - `PUT /:id` – update notebook name and/or description.
  - `DELETE /:id` – delete a notebook.

- **Notes API (`/api/notes`)**
  - `POST /` – create a note (`title` and `content` required). If `notebookId` is provided it is validated against the notebooks service.
  - `GET /` – list notes.
  - `GET /:id` – fetch a note by id.
  - `PUT /:id` – update note title/content.
  - `DELETE /:id` – delete a note.

## Local Development Tips

- While the default workflow relies on Docker, you can run each service directly:
  1. Start a MongoDB instance (or reuse the Compose-managed one).
  2. Set the required environment variables (`PORT`, `DB_URL`, and optionally `NOTEBOOKS_API_URL` for the notes service).
  3. Run `npm install` (first time) followed by `npm run dev` to start the server with nodemon.
- Docker volumes `notebooks-data` and `notes-data` persist database state between restarts; remove them if you want to start fresh.
- The Dockerfiles also include a `production` stage (`gcr.io/distroless/nodejs22`) if you want to build minimal images for deployment: `docker build --target production .`.

## Troubleshooting

- If the notes API returns `Notebook does not exist`, ensure the notebooks service is healthy and that `NOTEBOOKS_API_URL` points to the correct internal address.
- Make sure no other process is bound to port 8080 before starting the stack.
- Use `docker compose logs -f notes` or `docker compose logs -f notebooks` for live logs while debugging requests.

