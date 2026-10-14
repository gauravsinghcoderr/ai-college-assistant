
const API_BASE_URL =
    "https://iglv60wmjf.execute-api.ap-south-1.amazonaws.com";

let currentSubject = "";
let currentUnit = 1;
let currentResource = "Notes";
let cachedNotes = null;

const pageIds = [
    "subjects",
    "options-section",
    "material-section",
    "unit-section",
    "resource-section",
    "pyq-section"
];

function showPage(pageId) {
    pageIds.forEach((id) => {
        const page = document.getElementById(id);
        if (page) page.hidden = id !== pageId;
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function normalize(value) {
    return String(value ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function expectedApiSubject() {
    if (currentSubject === "Data Structures") return "DS";
    if (currentSubject === "Maths-4") return "Maths 4";

    return currentSubject;
}

function selectSubject(subject) {
    currentSubject = subject;

    document.getElementById("selected-subject").textContent =
        subject;

    document.getElementById("pyq-heading").textContent =
        subject + " - Previous Year Questions";

    showPage("options-section");
}

function openStudyMaterial() {
    document.getElementById("material-heading").textContent =
        currentSubject + " - Study Material";

    showPage("material-section");
}

function openPYQ() {
    document.getElementById("pyq-heading").textContent =
        currentSubject + " - Previous Year Questions";

    updatePYQMessage();
    showPage("pyq-section");
}

function openUnits(type) {
    currentResource = type;

    document.getElementById("unit-resource-label").textContent =
        type.toUpperCase();

    document.getElementById("selected-unit-heading").textContent =
        currentSubject + " - " + type;

    document.getElementById("unit-buttons").replaceChildren();

    for (let unit = 1; unit <= 5; unit++) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "unit-button";
        button.textContent = "Unit " + unit;
        button.addEventListener("click", () => selectUnit(unit));

        document.getElementById("unit-buttons").appendChild(button);
    }

    showPage("unit-section");
}

async function selectUnit(unit) {
    currentUnit = unit;

    document.getElementById("selected-unit").textContent =
        `${currentSubject} - Unit ${unit} - ${currentResource}`;

    document.getElementById("resource-label").textContent =
        currentResource.toUpperCase();

    showPage("resource-section");
    await showResources();
}

async function getNotesList() {
    if (cachedNotes) return cachedNotes;

    const response = await fetch(API_BASE_URL + "/");
    let data = await response.json();

    if (data && typeof data.body === "string") {
        try {
            data = JSON.parse(data.body);
        } catch {
            // Keep the original response if body is not JSON.
        }
    }

    if (!response.ok || !data.ok || !Array.isArray(data.notes)) {
        throw new Error("AWS API notes list response was not valid.");
    }

    cachedNotes = data.notes;
    return cachedNotes;
}
async function getSignedPDFUrl(noteKey) {
    const url = new URL(API_BASE_URL + "/");
    url.searchParams.set("action", "url");
    url.searchParams.set("key", noteKey);
    const response = await fetch(url.toString());
    let data = await response.json();

    if (data && typeof data.body === "string") {
        try {
            data = JSON.parse(data.body);
        } catch {
            // Keep the original response if body is not JSON.
        }
    }

    if (!response.ok || !data.ok || !data.url) {
        throw new Error(
            "AWS API did not return a PDF URL. The notes-list API works, " +
            "but the Lambda PDF-link response needs to be checked."
        );
    }

    return data.url;
}

function addMessage(container, message) {
    const paragraph = document.createElement("p");
    paragraph.textContent = message;
    container.appendChild(paragraph);
}

async function showResources() {
    const container = document.getElementById("resource-content");
    container.replaceChildren();

    if (currentResource === "Lectures") {
        const heading = document.createElement("h3");
        heading.textContent = "Video Lectures";
        container.appendChild(heading);

        addMessage(
            container,
            "Video lecture links have not been connected yet. " +
            "The unit-wise lecture section is ready."
        );
        return;
    }

    const heading = document.createElement("h3");
    heading.textContent = "Available Notes";
    container.appendChild(heading);

    addMessage(container, "Loading notes from AWS...");

    try {
        const notes = await getNotesList();

        const subjectToMatch = normalize(expectedApiSubject());
        const unitToMatch = normalize("unit" + currentUnit);

        const matchingNotes = notes.filter((note) => {
            return (
                normalize(note.subject) === subjectToMatch &&
                normalize(note.unit) === unitToMatch
            );
        });

        container.replaceChildren();
        container.appendChild(heading);

        if (matchingNotes.length === 0) {
            addMessage(
                container,
                "No PDF notes are uploaded for this subject and unit yet."
            );
            return;
        }

        addMessage(container, matchingNotes.length + " PDF file(s) found.");

        matchingNotes.forEach((note) => {
            const card = document.createElement("div");
            card.className = "resource-item";

            const name = document.createElement("h3");
            name.className = "resource-title";
            name.textContent = note.name;

            const details = document.createElement("p");
            details.className = "resource-meta";
            details.textContent =
                `${note.subject} • ${note.unit}`;

            const link = document.createElement("a");
            link.className = "resource-link";
            link.href = "#";
            link.textContent = "Open PDF ↗";

            link.addEventListener("click", async (event) => {
                event.preventDefault();

                // Open a tab immediately so the browser is less likely
                // to block it while the signed URL is being requested.
                const pdfTab = window.open("about:blank", "_blank");

                link.textContent = "Getting PDF link...";
                link.style.pointerEvents = "none";

                try {
                    const signedUrl = await getSignedPDFUrl(note.key);

                    if (pdfTab && !pdfTab.closed) {
                        pdfTab.location.href = signedUrl;
                    } else {
                        window.location.href = signedUrl;
                    }
                } catch (error) {
                    if (pdfTab && !pdfTab.closed) pdfTab.close();

                    console.error("PDF opening error:", error);

                    alert(
                        "PDF link nahi mila. Notes listing API chal rahi hai, " +
                        "lekin Lambda ka signed-URL response check karna hoga."
                    );
                } finally {
                    link.textContent = "Open PDF ↗";
                    link.style.pointerEvents = "";
                }
            });

            card.appendChild(name);
            card.appendChild(details);
            card.appendChild(link);
            container.appendChild(card);
        });
    } catch (error) {
        console.error("Notes loading error:", error);
        container.replaceChildren();

        const heading = document.createElement("h3");
        heading.textContent = "Unable to Load Notes";
        container.appendChild(heading);

        addMessage(
            container,
            "AWS se notes load nahi ho paye. Internet, CORS settings " +
            "aur API response check karo."
        );
    }
}

function backToOptions() {
    showPage("options-section");
}

function backToMaterial() {
    showPage("material-section");
}

function backToUnits() {
    showPage("unit-section");
}

function goHome() {
    showPage("subjects");
}

function updatePYQMessage() {
    const year = document.getElementById("pyq-year").value;
    const type = document.getElementById("pyq-type").value;
    const result = document.getElementById("pyq-result");

    result.textContent =
        `${currentSubject} • ${year} • ` +
        (type === "all" ? "Complete Paper" : "Unit-wise Questions") +
        ". PYQ files have not been connected yet.";
}

document.addEventListener("DOMContentLoaded", () => {
    const year = document.getElementById("pyq-year");
    const type = document.getElementById("pyq-type");

    if (year) year.addEventListener("change", updatePYQMessage);
    if (type) type.addEventListener("change", updatePYQMessage);
});

// Make functions available to the onclick handlers in index.html.
window.selectSubject = selectSubject;
window.openStudyMaterial = openStudyMaterial;
window.openPYQ = openPYQ;
window.openUnits = openUnits;
window.selectUnit = selectUnit;
window.backToOptions = backToOptions;
window.backToMaterial = backToMaterial;
window.backToUnits = backToUnits;
window.goHome = goHome;



