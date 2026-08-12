const SUPABASE_URL = "https://toeamjaomjgamdmavdck.supabase.co";
const SUPABASE_ANON_KEY = "DIN_PUBLISHABLE_KEY_HER";

const LEVELS = [
  "DPF10",
  "DPF25",
  "DPF35",
  "DPF60",
  "DPF100",
  "DPF200",
  "DPF500",
  "DPF1000"
];

const CATEGORIES = [
  "Dame",
  "Herre",
  "Mix",
  "Junior"
];

let tournaments = [];
let selectedLevels = [];
let selectedCategories = [];
let visible = 25;

const $ = (id) => document.getElementById(id);

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return map[char];
  });
}

function createChips() {
  $("levels").innerHTML = LEVELS
    .map(
      (level) =>
        `<button class="chip" data-level="${level}" type="button">${level}</button>`
    )
    .join("");

  $("categories").innerHTML = CATEGORIES
    .map(
      (category) =>
        `<button class="chip" data-category="${category}" type="button">${category}</button>`
    )
    .join("");

  document.querySelectorAll("[data-level]").forEach((button) => {
    button.addEventListener("click", () => {
      toggleFilter(
        button.dataset.level,
        "level",
        button
      );
    });
  });

  document.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      toggleFilter(
        button.dataset.category,
        "category",
        button
      );
    });
  });
}

function toggleFilter(value, type, button) {
  const current =
    type === "level"
      ? selectedLevels
      : selectedCategories;

  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];

  if (type === "level") {
    selectedLevels = next;
  } else {
    selectedCategories = next;
  }

  button.classList.toggle("active");

  visible = 25;

  render();
}

function classMatches(tournament) {
  if (
    selectedLevels.length === 0 &&
    selectedCategories.length === 0
  ) {
    return true;
  }

  const classes = Array.isArray(tournament.classes)
    ? tournament.classes
    : [];

  return classes.some((classItem) => {
    const classLevels = Array.isArray(classItem.level)
      ? classItem.level
      : [];

    const classCategories = Array.isArray(classItem.category)
      ? classItem.category
      : [];

    const levelMatch =
      selectedLevels.length === 0 ||
      selectedLevels.some((level) =>
        classLevels.includes(level)
      );

    const categoryMatch =
      selectedCategories.length === 0 ||
      selectedCategories.some((category) =>
        classCategories.includes(category)
      );

    return levelMatch && categoryMatch;
  });
}

function getFilteredTournaments() {
  const query = $("search").value
    .trim()
    .toLowerCase();

  const dateFrom = $("dateFrom").value;
  const dateTo = $("dateTo").value;

  return tournaments.filter((tournament) => {
    const haystack = [
      tournament.name,
      tournament.center,
      tournament.city
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const searchMatch =
      !query ||
      haystack.includes(query);

    const classMatch =
      classMatches(tournament);

    const fromMatch =
      !dateFrom ||
      (
        tournament.tournament_date &&
        tournament.tournament_date >= dateFrom
      );

    const toMatch =
      !dateTo ||
      (
        tournament.tournament_date &&
        tournament.tournament_date <= dateTo
      );

    return (
      searchMatch &&
      classMatch &&
      fromMatch &&
      toMatch
    );
  });
}

function formatDate(value) {
  if (!value) {
    return "Ikke oplyst";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Ikke oplyst";
  }

  return new Intl.DateTimeFormat(
    "da-DK",
    {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }
  ).format(date);
}

function formatDeadline(value) {
  if (!value) {
    return "Ikke oplyst";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Ikke oplyst";
  }

  return new Intl.DateTimeFormat(
    "da-DK",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(date);
}

function render() {
  const filtered =
    getFilteredTournaments();

  $("status").textContent =
    `${filtered.length} turnering${filtered.length === 1 ? "" : "er"} fundet`;

  const shown =
    filtered.slice(0, visible);

  if (shown.length === 0) {
    $("list").innerHTML = `
      <div class="empty">
        Ingen turneringer matcher dine filtre.
      </div>
    `;

    $("more").hidden = true;

    return;
  }

  $("list").innerHTML =
    shown
      .map((tournament) => {
        const rankedinButton =
          tournament.rankedin_link
            ? `
              <a
                class="rankedin"
                href="${esc(tournament.rankedin_link)}"
                target="_blank"
                rel="noopener"
              >
                Se på Rankedin
              </a>
            `
            : "";

        return `
          <article class="card">

            ${rankedinButton}

            <h2>
              ${esc(tournament.name || "Turnering")}
            </h2>

            <div class="meta">

              <div>
                <strong>Dato:</strong>
                <span>
                  ${formatDate(tournament.tournament_date)}
                </span>
              </div>

              <div>
                <strong>By:</strong>
                <span>
                  ${esc(tournament.city || "Ikke oplyst")}
                </span>
              </div>

              <div>
                <strong>Center:</strong>
                <span>
                  ${esc(tournament.center || "Ikke oplyst")}
                </span>
              </div>

            </div>

            <div class="deadline">

              <strong>
                Deadline:&nbsp;
              </strong>

              ${formatDeadline(tournament.deadline)}

            </div>

          </article>
        `;
      })
      .join("");

  $("more").hidden =
    filtered.length <= visible;
}

async function loadTournaments() {
  try {
    const today =
      new Date()
        .toISOString()
        .slice(0, 10);

    const endpoint =
      `${SUPABASE_URL}/rest/v1/tournaments` +
      `?select=*` +
      `&tournament_date=gte.${today}` +
      `&order=tournament_date.asc`;

    const response =
      await fetch(
        endpoint,
        {
          method: "GET",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization:
              `Bearer ${SUPABASE_ANON_KEY}`,
            "Accept-Profile": "public"
          }
        }
      );

    if (!response.ok) {
      const errorText =
        await response.text();

      throw new Error(errorText);
    }

    tournaments =
      await response.json();

    render();

  } catch (error) {
    console.error(error);

    $("status").textContent =
      "Kunne ikke hente turneringer";

    $("list").innerHTML = `
      <div class="empty">
        ${esc(error.message)}
      </div>
    `;

    $("more").hidden = true;
  }
}

$("search").addEventListener(
  "input",
  () => {
    visible = 25;
    render();
  }
);

$("dateFrom").addEventListener(
  "change",
  () => {
    visible = 25;
    render();
  }
);

$("dateTo").addEventListener(
  "change",
  () => {
    visible = 25;
    render();
  }
);

$("more").addEventListener(
  "click",
  () => {
    visible += 25;
    render();
  }
);

$("reset").addEventListener(
  "click",
  () => {
    selectedLevels = [];
    selectedCategories = [];

    $("search").value = "";
    $("dateFrom").value = "";
    $("dateTo").value = "";

    visible = 25;

    document
      .querySelectorAll(".chip")
      .forEach((chip) => {
        chip.classList.remove("active");
      });

    render();
  }
);

createChips();
loadTournaments();
