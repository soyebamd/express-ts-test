"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const node_path_1 = require("node:path");
const db_1 = require("./db");
const PORT = 8000;
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.static((0, node_path_1.resolve)(__dirname, "../public"), { index: false }));
//special offers
app.get("/special-offers", (req, res) => {
    const specialOffers = [
        {
            id: 1,
            title: "Free Pet Grooming",
            description: "Get a free grooming session for your pet when you adopt from our shelter.",
            imageUrl: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=85",
        },
        {
            id: 2,
            title: "Discounted Pet Supplies",
            description: "Get exclusive discounts on all pet supplies when you adopt from our shelter.",
            imageUrl: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=800&q=85",
        },
    ];
    res.status(200).json(specialOffers);
});
const matchesQuery = (petValue, queryValue) => {
    if (petValue === null || petValue === undefined) {
        return queryValue === "null";
    }
    if (typeof petValue === "number") {
        const numberValue = Number(queryValue);
        return (queryValue.trim() !== "" &&
            Number.isFinite(numberValue) &&
            petValue === numberValue);
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
const getPetValue = (pet, key) => {
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
app.get("/", (req, res) => {
    res.vary("Accept");
    if (req.get("accept")?.includes("text/html")) {
        res.sendFile((0, node_path_1.resolve)(__dirname, "../public/index.html"));
        return;
    }
    const searchTag = req.query;
    const queryKeys = Object.keys(searchTag);
    const search = (0, db_1.getAllPets)().filter((pet) => queryKeys.every((key) => {
        const queryValue = searchTag[key];
        return (queryValue !== undefined &&
            matchesQuery(getPetValue(pet, key), queryValue));
    }));
    res.status(200).json(search);
});
app.get("/:id", (req, res) => {
    const id = Number(req.params.id);
    const pet = Number.isSafeInteger(id) ? (0, db_1.getPetById)(id) : undefined;
    if (!pet) {
        res.status(404).json({ message: "No pet found" });
        return;
    }
    res.status(200).json(pet);
});
app.use((req, res) => {
    res.status(404).json({ message: "No endpoint found" });
});
app.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`);
});
