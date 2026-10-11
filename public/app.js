const animalPhotos = {
  Dog: [
    "photo-1552053831-71594a27632d",
    "photo-1551717743-49959800b1f6",
    "photo-1543466835-00a7907e9de1",
    "photo-1583337130417-3346a1be7dee",
  ],
  Cat: [
    "photo-1514888286974-6c03e2ca1dba",
    "photo-1573865526739-10659fec78a5",
    "photo-1533738363-b7f9aef128ce",
    "photo-1574158622682-e40e69881006",
  ],
  Rabbit: [
    "photo-1585110396000-c9ffd4e4b308",
    "photo-1589933767411-38a58367efd7",
    "photo-1583301286816-f4f05e1e8b25",
    "photo-1591382386627-349b692688ff",
  ],
};

const imageUrl = (photoId, width = 900, height = 680) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&h=${height}&q=85`;

const photoFor = (pet) => {
  const photos = animalPhotos[pet.species] ?? animalPhotos.Dog;
  const speciesPets = allPets.filter((candidate) => candidate.species === pet.species);
  const photoIndex = speciesPets.findIndex((candidate) => candidate.id === pet.id);
  return imageUrl(photos[Math.max(photoIndex, 0) % photos.length]);
};

const petGrid = document.querySelector("#pet-grid");
const resultsLabel = document.querySelector("#results-label");
const searchInput = document.querySelector("#pet-search");
const availabilitySelect = document.querySelector("#availability");
const emptyState = document.querySelector("#empty-state");
const errorState = document.querySelector("#error-state");
const petDialog = document.querySelector("#pet-dialog");
const dialogContent = document.querySelector("#dialog-content");
const offerGrid = document.querySelector("#offer-grid");

let allPets = [];
let activeSpecies = "all";
let searchTerm = "";

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

const formatDate = (value) => {
  if (!value) return "Not yet adopted";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not yet adopted"
    : new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
};

const fetchJson = async (url) => {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json();
};

const getFilteredPets = () => {
  const status = availabilitySelect.value;
  const query = searchTerm.trim().toLocaleLowerCase();

  return allPets.filter((pet) => {
    const matchesSpecies = activeSpecies === "all" || pet.species === activeSpecies;
    const matchesStatus =
      status === "all" ||
      (status === "available" && !pet.adopted) ||
      (status === "adopted" && pet.adopted);
    const matchesSearch =
      !query ||
      `${pet.name} ${pet.breed} ${pet.species}`.toLocaleLowerCase().includes(query);
    return matchesSpecies && matchesStatus && matchesSearch;
  });
};

const renderPets = () => {
  const filteredPets = getFilteredPets();
  const statusLabel =
    availabilitySelect.value === "available"
      ? "looking for a home"
      : availabilitySelect.value === "adopted"
        ? "already adopted"
        : "lovely souls";

  resultsLabel.textContent = `${filteredPets.length} ${statusLabel}`;
  petGrid.setAttribute("aria-busy", "false");
  emptyState.hidden = filteredPets.length !== 0;
  petGrid.hidden = filteredPets.length === 0;
  errorState.hidden = true;

  petGrid.innerHTML = filteredPets
    .map((pet) => {
      const adopted = Boolean(pet.adopted);
      return `
        <button class="pet-card" type="button" data-pet-id="${pet.id}" aria-label="Meet ${escapeHtml(pet.name)}, ${escapeHtml(pet.breed)}">
          <div class="pet-photo-wrap">
            <img class="pet-photo" src="${photoFor(pet)}" alt="${escapeHtml(pet.name)}, a ${escapeHtml(pet.breed)} ${escapeHtml(pet.species.toLowerCase())}" loading="lazy" />
            <span class="status-badge${adopted ? " adopted-badge" : ""}">${adopted ? "FOUND THEIR HOME" : "READY TO MEET"}</span>
            <span class="photo-id">GOODSIDE #${String(pet.id).padStart(3, "0")}</span>
          </div>
          <div class="pet-card-body">
            <div class="pet-card-topline">
              <h3 class="pet-name">${escapeHtml(pet.name)}</h3>
              <span class="pet-species">${escapeHtml(pet.species)}</span>
            </div>
            <p class="pet-breed">${escapeHtml(pet.breed)}</p>
            <div class="pet-card-footer">
              <span>${escapeHtml(String(pet.age))} ${pet.age === 1 ? "year" : "years"} old</span>
              <strong>${adopted ? "See their story ↗" : "Meet me ↗"}</strong>
            </div>
          </div>
        </button>`;
    })
    .join("");
};

const showPetDetails = async (petId) => {
  petDialog.showModal();
  dialogContent.innerHTML =
    '<div class="detail-error" role="status">Getting to know your new friend…</div>';

  try {
    const pet = await fetchJson(`/${encodeURIComponent(petId)}`);
    const adopted = Boolean(pet.adopted);
    const vaccinations = Array.isArray(pet.medicalRecord?.vaccinations)
      ? pet.medicalRecord.vaccinations.map(escapeHtml).join(", ")
      : "No vaccination records yet";

    dialogContent.innerHTML = `
      <div class="dialog-layout">
        <div class="dialog-image-wrap">
          <img class="dialog-image" src="${photoFor(pet)}" alt="${escapeHtml(pet.name)}" />
        </div>
        <div class="dialog-details">
          <div class="eyebrow section-eyebrow">${adopted ? "A GOODSide SUCCESS STORY" : "READY FOR A FOREVER HOME"}</div>
          <h2 id="dialog-name">${escapeHtml(pet.name)}</h2>
          <p class="dialog-breed">${escapeHtml(pet.breed)} · ${escapeHtml(pet.species)}</p>
          <p class="dialog-about">
            ${escapeHtml(pet.name)} is ${escapeHtml(String(pet.age))} ${pet.age === 1 ? "year" : "years"} old and
            ${adopted ? "found a loving home on" : "has been waiting for a loving home since"}
            ${escapeHtml(formatDate(adopted ? pet.adoptionDate : pet.intakeDate))}.
            ${adopted ? "We’re so happy for this happy ending." : "Could that home be yours?"}
          </p>
          <div class="dialog-facts">
            <div class="dialog-fact"><span>Age</span><strong>${escapeHtml(String(pet.age))} ${pet.age === 1 ? "year" : "years"}</strong></div>
            <div class="dialog-fact"><span>Weight</span><strong>${escapeHtml(String(pet.medicalRecord?.weightKg ?? "Not listed"))} kg</strong></div>
            <div class="dialog-fact"><span>Intake date</span><strong>${escapeHtml(formatDate(pet.intakeDate))}</strong></div>
            <div class="dialog-fact"><span>Microchip</span><strong>${escapeHtml(pet.medicalRecord?.microchipId ?? "Not listed")}</strong></div>
          </div>
          <p class="dialog-vaccinations"><strong>Vaccinations:</strong> ${vaccinations}</p>
          ${adopted ? "" : '<a class="dialog-contact" href="#offers">See adoption perks ↗</a>'}
        </div>
      </div>`;
  } catch {
    dialogContent.innerHTML =
      '<div class="detail-error" role="alert">We couldn’t load this pet’s details. Close this card and try again.</div>';
  }
};

const loadPets = async () => {
  errorState.hidden = true;
  emptyState.hidden = true;
  petGrid.hidden = false;
  petGrid.setAttribute("aria-busy", "true");
  resultsLabel.textContent = "Finding your new best friend…";

  try {
    allPets = await fetchJson("/");
    if (!Array.isArray(allPets)) {
      throw new Error("The pet endpoint did not return a list.");
    }
    const available = allPets.filter((pet) => !pet.adopted).length;
    document.querySelector("#total-count").textContent = String(allPets.length);
    document.querySelector("#available-count").textContent = String(available);
    document.querySelector("#everyone-count").textContent = String(allPets.length);
    renderPets();
  } catch (error) {
    petGrid.hidden = true;
    petGrid.setAttribute("aria-busy", "false");
    resultsLabel.textContent = "Pet listings unavailable";
    errorState.hidden = false;
    console.error("Unable to load pets:", error);
  }
};

const loadOffers = async () => {
  try {
    const offers = await fetchJson("/special-offers");
    if (!Array.isArray(offers)) {
      throw new Error("The special-offers endpoint did not return a list.");
    }
    offerGrid.innerHTML = offers
      .map(
        (offer) => `
          <article class="offer-card">
            <img src="${escapeHtml(offer.imageUrl)}" alt="" loading="lazy" />
            <div class="offer-copy">
              <span class="offer-label">A GOODSTART GIFT</span>
              <h3>${escapeHtml(offer.title)}</h3>
              <p>${escapeHtml(offer.description)}</p>
            </div>
          </article>`,
      )
      .join("");
    offerGrid.setAttribute("aria-busy", "false");
  } catch (error) {
    offerGrid.innerHTML =
      '<p class="offer-error">Our adoption extras are unavailable right now. Please check back soon.</p>';
    offerGrid.setAttribute("aria-busy", "false");
    console.error("Unable to load special offers:", error);
  }
};

document.querySelectorAll(".filter-chip").forEach((button) => {
  button.addEventListener("click", () => {
    activeSpecies = button.dataset.species ?? "all";
    document.querySelectorAll(".filter-chip").forEach((chip) => {
      const active = chip === button;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", String(active));
    });
    renderPets();
  });
});

searchInput.addEventListener("input", () => {
  searchTerm = searchInput.value;
  renderPets();
});

availabilitySelect.addEventListener("change", renderPets);

petGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-pet-id]");
  if (card) void showPetDetails(card.dataset.petId);
});

document.querySelector(".dialog-close").addEventListener("click", () => {
  petDialog.close();
});

petDialog.addEventListener("click", (event) => {
  if (event.target === petDialog) petDialog.close();
});

document.querySelector("#clear-filters").addEventListener("click", () => {
  activeSpecies = "all";
  searchTerm = "";
  searchInput.value = "";
  availabilitySelect.value = "all";
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    const active = chip.dataset.species === "all";
    chip.classList.toggle("is-active", active);
    chip.setAttribute("aria-pressed", String(active));
  });
  renderPets();
});

document.querySelector("#retry-load").addEventListener("click", () => {
  void loadPets();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }
});

void loadPets();
void loadOffers();
