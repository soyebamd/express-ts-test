"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPetById = exports.getAllPets = exports.db = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const pets_1 = require("./data/pets");
const databasePath = (0, node_path_1.resolve)(process.env.DATABASE_PATH ?? "data/pets.sqlite");
(0, node_fs_1.mkdirSync)((0, node_path_1.dirname)(databasePath), { recursive: true });
exports.db = new better_sqlite3_1.default(databasePath);
exports.db.pragma("journal_mode = WAL");
exports.db.pragma("foreign_keys = ON");
exports.db.exec(`
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
const petCount = exports.db.prepare("SELECT COUNT(*) AS count FROM pets").get();
if (petCount.count === 0) {
    const insertPet = exports.db.prepare(`
    INSERT INTO pets (
      id, name, species, breed, age, adopted, intake_date, adoption_date,
      weight_kg, microchip_id, photo
    ) VALUES (
      @id, @name, @species, @breed, @age, @adopted, @intakeDate, @adoptionDate,
      @weightKg, @microchipId, @photo
    )
  `);
    const insertVaccination = exports.db.prepare("INSERT INTO vaccinations (pet_id, name) VALUES (?, ?)");
    exports.db.transaction((initialPets) => {
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
    })(pets_1.pets);
}
const vaccinationsFor = exports.db.prepare("SELECT name FROM vaccinations WHERE pet_id = ? ORDER BY rowid");
const toPet = (row) => ({
    id: row.id,
    name: row.name,
    species: row.species,
    breed: row.breed,
    age: row.age,
    adopted: row.adopted === 1,
    intakeDate: new Date(row.intake_date),
    ...(row.adoption_date ? { adoptionDate: new Date(row.adoption_date) } : {}),
    medicalRecord: {
        vaccinations: vaccinationsFor.all(row.id).map(({ name }) => name),
        weightKg: row.weight_kg,
        microchipId: row.microchip_id,
    },
    photo: row.photo,
});
const getAllPets = () => {
    const rows = exports.db.prepare("SELECT * FROM pets ORDER BY id").all();
    return rows.map(toPet);
};
exports.getAllPets = getAllPets;
const getPetById = (id) => {
    const row = exports.db.prepare("SELECT * FROM pets WHERE id = ?").get(id);
    return row ? toPet(row) : undefined;
};
exports.getPetById = getPetById;
