# Project Guide

## Overview

`express-ts` is a small Express 5 API written in TypeScript. It stores pet data in a local SQLite database and supports listing, filtering, and looking up pets by ID. The initial database is seeded from `src/data/pets.ts` when the `pets` table is empty.

## Project layout

- `src/index.ts` — creates the Express app, enables CORS, defines routes, and starts the server.
- `src/data/pets.ts` — exports the `Pet` and `PetQuery` types and the initial pet data.
- `src/db.ts` — opens the SQLite database, creates the schema, seeds initial data, and provides pet queries.
- `data/pets.sqlite` — default SQLite database file, created automatically on first startup.
- `package.json` — dependencies and npm scripts.
- `tsconfig.json` — strict TypeScript configuration; source is compiled from `src/` to `dist/`.

## Stack and commands

- Node.js with TypeScript, Express, and `better-sqlite3`.
- `npm run dev` — run `src/index.ts` with `tsx` watch mode.
- `npm run build` — type-check and compile TypeScript to `dist/`.
- `npm start` — run the compiled `dist/index.js`.
- `npm run db:setup` — create the database schema and seed the initial pets without starting the server.
- Set `DATABASE_PATH` to use a different SQLite file path; the default is `data/pets.sqlite` relative to the working directory.

The server listens on port `8000`. CORS middleware is enabled for all routes.

## API

### `GET /`

Returns a JSON array of pets (`Pet[]`). Without query parameters it returns all pets. Query parameters can be combined; a pet is returned only when it matches every supplied filter:

- String fields are compared exactly against the query string.
- Numeric fields such as `id` and `age` are converted from the query string and compared numerically.
- Boolean fields such as `adopted` accept `true` or `false` (case-insensitive).
- Date fields match the start of their ISO string, so date-only values such as `2024-06-15` match that date.
- Nested medical record fields use dotted keys, for example `medicalRecord.weightKg=18.4` or `medicalRecord.vaccinations=Rabies`. Array filters match when any element equals the query value; nullable fields match `null` with the literal `null`.

The query request type is `PetQuery` in `src/data/pets.ts`.

### `GET /:id`

Looks up a pet by its numeric ID represented as a URL string. Returns the pet with status `200`, or `{ "message": "No pet found" }` with status `404`.

### Unknown routes

Return `{ "message": "No endpoint found" }` with status `404`.

## Data model and persistence

Pets are stored in the `pets` table. Vaccinations are stored in a related `vaccinations` table with a foreign key to the pet. The API reconstructs `Date` instances and the nested `medicalRecord` when returning JSON, so response shapes remain compatible with `Pet`. Database initialization is automatic at server startup. Seeding runs only when there are no pet rows; deleting the SQLite file resets the database to the initial `pets.ts` data.
