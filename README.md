# Notes REST API

This repository is a Docker-first training project that shows how to assemble a small microservice architecture with Docker Compose. Two Express/MongoDB APIs and an NGINX reverse proxy run as containers, so the full stack comes up with a single `docker compose up`.

- `notebooks-backend`: CRUD API for managing notebooks.
- `notes-backend`: CRUD API for notes (optionally validates notebook ownership through the notebooks API).
- `reverse-proxy`: NGINX gateway that exposes both APIs under `http://localhost:8080`.

## Docker Compose Architecture

### Root-level files
- `compose.yaml` is the entrypoint for the whole training project. It uses the Compose `include` directive to pull in each service's own `compose.yaml`, then layers the reverse proxy, shared network, and inter-service dependencies on top.
- `compose.override.yaml` extends the base definition during local development. It connects the backend stacks to `notes-app-net` and configures cross-service environment variables such as `NOTEBOOKS_API_URL`.
- Run `docker compose config` in the repo root if you want to inspect the fully rendered Compose file that Docker will use.

### Service-level Compose files
- Each backend keeps its Compose configuration close to the code (for example `notebooks-backend/compose.yaml`). Those files define the Node.js service, its MongoDB companion, bind mounts for hot-reload (`./src:/app/src`), and the named volumes that persist data (`notebooks-data`, `notes-data`).
- When the root Compose file includes them, the services join the shared network from the override file so they can talk to one another. You can also run them standalone for focused exercises: `docker compose -f notebooks-backend/compose.yaml up`.
- Every service-specific Compose file uses unique project names (`name:` field) to avoid collisions when you experiment with them separately.

### Networking and routing
- `notes-app-net` is declared at the root so all containers share a single bridge network. Internal hostnames match service names (`http://notes`, `http://notebooks`).
- `reverse-proxy/nginx.conf` maps `/api/notebooks` to the notebooks container and `/api/notes` to the notes container. The proxy only publishes port 8080 on your machine, keeping the MongoDB instances internal.

## Dockerfiles and Images
- Both backends ship with multi-stage Dockerfiles. The `development` stage installs dev dependencies and runs `nodemon` so code changes from the host are reflected immediately. The `production` stage (based on `gcr.io/distroless/nodejs22`) is handy when you want to discuss smaller deployment images.
- MongoDB runs from the official `mongodb/mongodb-community-server:7.0-ubuntu2204` image. Init scripts under `*/db-config/mongo-init.js` create users with credentials provided through `.env` files.

## Configuration
- `.env` files in each backend set the MongoDB username/password/database. They are consumed automatically by Docker Compose via the `env_file` directive.
- The notes service needs `NOTEBOOKS_API_URL` so it can call the notebooks API. In the shared override file it resolves to `http://notebooks/api/notebooks`, which is only reachable inside the Docker network.
- Customize ports by editing the service-level Compose files (for example change `3000:80` if port 3000 is busy) or by using an additional override file.

## Running the Stack

From the repository root:

```bash
docker compose up --build
```

This command:

1. Builds the Node.js services with the `development` build stage, mounting your local source so `nodemon` can reload on changes.
2. Starts dedicated MongoDB containers, seeding users via the init scripts referenced in each Compose file.
3. Launches the reverse proxy that publishes both APIs on `http://localhost:8080`.

When the containers are ready you can explore the APIs, for example:

```bash
# Create a notebook
curl -X POST http://localhost:8080/api/notebooks \
  -H "Content-Type: application/json" \
  -d '{"name":"Personal","description":"Personal notes"}'

# List all notes
curl http://localhost:8080/api/notes
```

Stop the stack (while keeping the volumes) with:

```bash
docker compose down
```

Add `--volumes` if you want to clear MongoDB data for a fresh start.

## Working With Individual Services
- Spin up just one backend for debugging: `docker compose -f notes-backend/compose.yaml up`.
- Combine the root file with a service file to mix and match environments, e.g. `docker compose -f compose.yaml -f notebooks-backend/compose.yaml up notebooks`.
- Use `docker compose logs -f notes` and `docker compose exec notes npm test` to inspect or interact with a running container.

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

- You can run the services without Docker by installing dependencies (`npm install`), providing the same environment variables (`PORT`, `DB_URL`, `NOTEBOOKS_API_URL`), and starting `npm run dev`.
- Named volumes (`notebooks-data`, `notes-data`) keep MongoDB state between restarts. Remove them when you want to reset your training environment: `docker volume rm notes-rest-api_notebooks-data`.
- `docker compose exec notebooks mongosh` drops you into the Mongo shell that runs inside the container if you want to inspect seeded data.

## Troubleshooting

- If the notes API returns `Notebook does not exist`, confirm the notebooks service is healthy and that `NOTEBOOKS_API_URL` points to `http://notebooks/api/notebooks`.
- Ensure nothing else is listening on port 8080 before starting the reverse proxy.
- Use `docker compose ps` to check container state and `docker compose logs -f reverse-proxy` to see routing errors.
