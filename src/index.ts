import express from "express";
import type { Express, Request, Response } from "express";
import cors from "cors";
import { resolve } from "node:path";

import type { Pet, PetQuery, PetQueryKey } from "./data/pets";
import { getAllPets, getPetById } from "./db";

const PORT = 8000;
const app: Express = express();

app.use(cors());
app.use(express.static(resolve(__dirname, "../public"), { index: false }));

//special offers

console.log(`TypeScript version:Soyeb Ahmed 6.0.3`);

app.get("/special-offers", (req: Request, res: Response): void => {
  const specialOffers = [
    {
      id: 1,
      title: "Free Pet Grooming",
      description:
        "Get a free grooming session for your pet when you adopt from our shelter.",
      imageUrl:
        "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=85",
    },
    {
      id: 2,
      title: "Discounted Pet Supplies",
      description:
        "Get exclusive discounts on all pet supplies when you adopt from our shelter.",
      imageUrl:
        "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=800&q=85",
    },
  ];

  res.status(200).json(specialOffers);
});

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
    res.vary("Accept");

    if (req.get("accept")?.includes("text/html")) {
      res.sendFile(resolve(__dirname, "../public/index.html"));
      return;
    }

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
