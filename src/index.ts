import express from "express";
import type { Express, Request, Response } from "express";
import cors from "cors";

import type { Pet, PetQuery, PetQueryKey } from "./data/pets";
import { getAllPets, getPetById } from "./db";

const PORT = 8000;
const app: Express = express();

app.use(cors());

console.log(`TypeScript version:Soyeb Ahmed 6.0.3`);

const matchesQuery = (petValue: unknown, queryValue: string): boolean => {
  if (petValue === null || petValue === undefined) {
    return queryValue === "null";
  }

  if (typeof petValue === "number") {
    const numberValue = Number(queryValue);
    return (
      queryValue.trim() !== "" &&
      Number.isFinite(numberValue) &&
      petValue === numberValue
    );
  }

  if (typeof petValue === "boolean") {
    return String(petValue) === queryValue.toLowerCase();
  }

  if (petValue instanceof Date) {
    return queryValue !== "" && petValue.toISOString().startsWith(queryValue);
  }

  if (Array.isArray(petValue)) {
    return petValue.includes(queryValue);
  }

  return String(petValue) === queryValue;
};

const getPetValue = (pet: Pet, key: PetQueryKey): unknown => {
  switch (key) {
    case "medicalRecord.vaccinations":
      return pet.medicalRecord.vaccinations;
    case "medicalRecord.weightKg":
      return pet.medicalRecord.weightKg;
    case "medicalRecord.microchipId":
      return pet.medicalRecord.microchipId;
    default:
      return pet[key];
  }
};

app.get(
  "/",
  (req: Request<{}, {}, {}, PetQuery>, res: Response<Pet[]>): void => {
    const searchTag = req.query;
    const queryKeys = Object.keys(searchTag) as PetQueryKey[];
    const search = getAllPets().filter((pet: Pet): boolean =>
      queryKeys.every((key: PetQueryKey): boolean => {
        const queryValue = searchTag[key];
        return (
          queryValue !== undefined &&
          matchesQuery(getPetValue(pet, key), queryValue)
        );
      }),
    );

    res.status(200).json(search);
  },
);

app.get(
  "/:id",
  (
    req: Request<{ id: string }>,
    res: Response<Pet | { message: string }>,
  ): void => {
    const id = Number(req.params.id);
    const pet = Number.isSafeInteger(id) ? getPetById(id) : undefined;

    if (!pet) {
      res.status(404).json({ message: "No pet found" });
      return;
    }
    res.status(200).json(pet);
  },
);

app.use((req: Request, res: Response<{ message: string }>): void => {
  res.status(404).json({ message: "No endpoint found" });
});

app.listen(PORT, (): void => {
  console.log(`Listening on port: ${PORT}`);
});
