# Goodside Pet Adoption

A small Express 5 and TypeScript app for browsing adoptable pets. It serves a responsive adoption dashboard at `/` in a browser and keeps its JSON endpoints available for API clients.

## Run the app

- `npm install` — install dependencies.
- `npm run dev` — start the development server with `tsx` watch mode.
- `npm run build` — compile TypeScript into `dist/`.
- `npm start` — run the compiled server.
- `npm run db:setup` — create the SQLite schema and seed the initial pets without starting the server.

The server listens on port `8000`. Open <http://localhost:8000> to browse the pet dashboard. Set `DATABASE_PATH` to use a different SQLite file; the default is `data/pets.sqlite`, relative to the working directory.

## Dashboard

The dashboard loads pets and special offers from the JSON endpoints, and fetches a pet's full details when its card is selected. Use the search field, species filters, and adoption-status menu to browse the listings. Animal photographs are served by Unsplash; their license is available at <https://unsplash.com/license>.

## API

Requests to `/` that accept `text/html` receive the dashboard. JSON clients can request `GET /` with `Accept: application/json`; query parameters can be combined to filter the pet list.

### `GET /`

Returns a JSON array of pets. Without query parameters, it returns all pets. Supported filters include pet fields such as `species`, `adopted`, `age`, and `name`, and nested medical-record fields such as `medicalRecord.weightKg` and `medicalRecord.vaccinations`. Filters match exactly; date values match the beginning of their ISO string, array filters match any element, and nullable fields match the literal `null`.

### `GET /:id`

Looks up a pet by its numeric ID. Returns the pet with status `200`, or `{ "message": "No pet found" }` with status `404`.

### `GET /special-offers`

Returns the adoption offers shown on the dashboard.

Unknown routes return `{ "message": "No endpoint found" }` with status `404`.

## Data and project layout

- `src/index.ts` — Express routes, static dashboard hosting, and server startup.
- `src/db.ts` — SQLite schema, initial data seeding, and pet queries.
- `src/data/pets.ts` — pet types and initial data.
- `public/` — dashboard HTML, styles, and client-side API integration.
- `data/pets.sqlite` — default SQLite database, created automatically on startup.
- `dist/` — compiled JavaScript used by `npm start`.
