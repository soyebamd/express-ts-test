import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import type { Pet } from "./data/pets";
import { pets as seedPets } from "./data/pets";

const databasePath = resolve(process.env.DATABASE_PATH ?? "data/pets.sqlite");
mkdirSync(dirname(databasePath), { recursive: true });

export const db = new Database(databasePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS pets (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    breed TEXT NOT NULL,
    age INTEGER NOT NULL,
    adopted INTEGER NOT NULL CHECK (adopted IN (0, 1)),
    intake_date TEXT NOT NULL,
    adoption_date TEXT,
    weight_kg REAL NOT NULL,
    microchip_id TEXT,
    photo TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vaccinations (
    pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    PRIMARY KEY (pet_id, name)
  );
`);

const petCount = db.prepare("SELECT COUNT(*) AS count FROM pets").get() as {
  count: number;
};

if (petCount.count === 0) {
  const insertPet = db.prepare(`
    INSERT INTO pets (
      id, name, species, breed, age, adopted, intake_date, adoption_date,
      weight_kg, microchip_id, photo
    ) VALUES (
      @id, @name, @species, @breed, @age, @adopted, @intakeDate, @adoptionDate,
      @weightKg, @microchipId, @photo
    )
  `);
  const insertVaccination = db.prepare(
    "INSERT INTO vaccinations (pet_id, name) VALUES (?, ?)",
  );

  db.transaction((initialPets: Pet[]): void => {
    for (const pet of initialPets) {
      insertPet.run({
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        age: pet.age,
        adopted: Number(pet.adopted),
        intakeDate: pet.intakeDate.toISOString(),
        adoptionDate: pet.adoptionDate?.toISOString() ?? null,
        weightKg: pet.medicalRecord.weightKg,
        microchipId: pet.medicalRecord.microchipId,
        photo: pet.photo,
      });

      for (const vaccination of pet.medicalRecord.vaccinations) {
        insertVaccination.run(pet.id, vaccination);
      }
    }
  })(seedPets);
}

type PetRow = {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: number;
  adopted: number;
  intake_date: string;
  adoption_date: string | null;
  weight_kg: number;
  microchip_id: string | null;
  photo: string;
};

const vaccinationsFor = db.prepare(
  "SELECT name FROM vaccinations WHERE pet_id = ? ORDER BY rowid",
);

const toPet = (row: PetRow): Pet => ({
  id: row.id,
  name: row.name,
  species: row.species,
  breed: row.breed,
  age: row.age,
  adopted: row.adopted === 1,
  intakeDate: new Date(row.intake_date),
  ...(row.adoption_date ? { adoptionDate: new Date(row.adoption_date) } : {}),
  medicalRecord: {
    vaccinations: (vaccinationsFor.all(row.id) as { name: string }[]).map(
      ({ name }) => name,
    ),
    weightKg: row.weight_kg,
    microchipId: row.microchip_id,
  },
  photo: row.photo,
});

export const getAllPets = (): Pet[] => {
  const rows = db.prepare("SELECT * FROM pets ORDER BY id").all() as PetRow[];
  return rows.map(toPet);
};

export const getPetById = (id: number): Pet | undefined => {
  const row = db.prepare("SELECT * FROM pets WHERE id = ?").get(id) as
    | PetRow
    | undefined;
  return row ? toPet(row) : undefined;
};
