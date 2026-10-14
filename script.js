let currentSubject = "";
let currentUnit = 1;
let currentResource = "Notes";
let currentPage = "home";

/* Academic years for PYQ */
const academicYears = [
    "2025-26",
    "2024-25",
    "2023-24",
    "2022-23",
    "2021-22"
];

/* Helper: show one section and hide the others */
function showSection(sectionId) {
    const sectionIds = [
        "subjects",
        "options-section",
        "material-section",
        "unit-section",
        "resource-section",
        "pyq-section"
    ];

    sectionIds.forEach(function (id) {
        const section = document.getElementById(id);

        if (section) {
            section.hidden = id !== sectionId;
        }
    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* 1. Select a subject */
function selectSubject(subject) {
    currentSubject = subject;
    currentPage = "options";

    document.getElementById("selected-subject").textContent = subject;

    showSection("options-section");
    window.history.pushState(
        { page: "options" },
        "",
        "#options"
    );
}

/* 2. Open Study Material */
function openStudyMaterial() {
    currentPage = "material";

    document.getElementById("material-heading").textContent =
        currentSubject + " - Study Material";

    showSection("material-section");
    window.history.pushState(
        { page: "material" },
        "",
        "#study-material"
    );
}

/* 3. Open Notes or Lectures and display units */
function openUnits(resourceType) {
    currentResource = resourceType;
    currentPage = "units";

    document.getElementById("unit-resource-label").textContent =
        resourceType === "Notes" ? "STUDY NOTES" : "VIDEO LECTURES";

    document.getElementById("selected-unit-heading").textContent =
        currentSubject + " - " + resourceType;

    const unitButtons = document.getElementById("unit-buttons");
    unitButtons.innerHTML = "";

    for (let i = 1; i <= 5; i++) {
        const button = document.createElement("button");

        button.type = "button";
        button.textContent = "Unit " + i;

        button.addEventListener("click", function () {
            selectUnit(i);
        });

        unitButtons.appendChild(button);
    }

    showSection("unit-section");
    window.history.pushState(
        { page: "units" },
        "",
        "#units"
    );
}

/* 4. Open selected unit */
function selectUnit(unit) {
    currentUnit = unit;
    currentPage = "resource";

    document.getElementById("selected-unit").textContent =
        currentSubject + " - Unit " + currentUnit;

    document.getElementById("resource-label").textContent =
        currentResource === "Notes" ? "STUDY NOTES" : "VIDEO LECTURES";

    const resourceContent = document.getElementById("resource-content");
    resourceContent.innerHTML = "";

    const heading = document.createElement("h3");
    heading.textContent =
        currentSubject + " - Unit " + currentUnit + " " + currentResource;

    const message = document.createElement("p");

    if (currentResource === "Notes") {
        message.textContent =
            "Notes for " + currentSubject + ", Unit " + currentUnit +
            " will appear here once the PDF is connected.";
    } else {
        message.textContent =
            "Video lecture links for " + currentSubject +
            ", Unit " + currentUnit +
            " will appear here once they are added.";
    }

    const note = document.createElement("p");
    note.textContent =
        "Study material is not connected yet. We will add the actual files and links next.";

    resourceContent.appendChild(heading);
    resourceContent.appendChild(message);
    resourceContent.appendChild(note);

    showSection("resource-section");
    window.history.pushState(
        { page: "resource" },
        "",
        "#resource"
    );
}

/* 5. Open the separate PYQ section */
function openPYQ() {
    currentPage = "pyq";

    document.getElementById("pyq-heading").textContent =
        currentSubject + " - Previous Year Questions";

    const yearSelect = document.getElementById("pyq-year");
    const typeSelect = document.getElementById("pyq-type");

    // Ensure the latest 5 academic years are available
    yearSelect.innerHTML = "";

    academicYears.forEach(function (year) {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });

    // Default selections
    yearSelect.value = "2025-26";
    typeSelect.value = "all";

    updatePYQMessage();

    showSection("pyq-section");
    window.history.pushState(
        { page: "pyq" },
        "",
        "#pyq"
    );
}

/* 6. Update the PYQ information when filters change */
function updatePYQMessage() {
    const yearSelect = document.getElementById("pyq-year");
    const typeSelect = document.getElementById("pyq-type");
    const result = document.getElementById("pyq-result");

    if (!yearSelect || !typeSelect || !result) {
        return;
    }

    result.innerHTML = "";

    const details = document.createElement("p");
    details.textContent =
        "Subject: " + currentSubject +
        " | Year: " + yearSelect.value +
        " | Paper: " +
        typeSelect.options[typeSelect.selectedIndex].text;

    const message = document.createElement("p");
    message.textContent =
        "The question paper for this selection has not been connected yet. " +
        "After we add the actual paper, it will be available here.";

    result.appendChild(details);
    result.appendChild(message);
}

/* 7. Back navigation */
function backToOptions() {
    currentPage = "options";

    document.getElementById("selected-subject").textContent = currentSubject;

    showSection("options-section");
    window.history.pushState(
        { page: "options" },
        "",
        "#options"
    );
}

function backToMaterial() {
    currentPage = "material";

    showSection("material-section");
    window.history.pushState(
        { page: "material" },
        "",
        "#study-material"
    );
}

function backToUnits() {
    currentPage = "units";

    showSection("unit-section");
    window.history.pushState(
        { page: "units" },
        "",
        "#units"
    );
}

/* 8. Return to the home page */
function goHome() {
    currentSubject = "";
    currentUnit = 1;
    currentResource = "Notes";
    currentPage = "home";

    showSection("subjects");

    window.history.pushState(
        { page: "home" },
        "",
        "#home"
    );
}

/* 9. Browser Back button support */
window.addEventListener("popstate", function (event) {
    const page = event.state ? event.state.page : "home";

    currentPage = page;

    const pageToSection = {
        home: "subjects",
        options: "options-section",
        material: "material-section",
        units: "unit-section",
        resource: "resource-section",
        pyq: "pyq-section"
    };

    showSection(pageToSection[page] || "subjects");
});

/* 10. Listen for PYQ filter changes */
document.addEventListener("DOMContentLoaded", function () {
    const yearSelect = document.getElementById("pyq-year");
    const typeSelect = document.getElementById("pyq-type");

    if (yearSelect) {
        yearSelect.addEventListener("change", updatePYQMessage);
    }

    if (typeSelect) {
        typeSelect.addEventListener("change", updatePYQMessage);
    }
});



