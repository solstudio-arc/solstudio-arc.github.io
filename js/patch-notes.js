const patchList = document.querySelector("#patch-list");
const patchFilters = document.querySelector("#patch-filters");

function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
        element.className = className;
    }
    if (text) {
        element.textContent = text;
    }
    return element;
}

function getInitialFilter(apps) {
    const idFromHash = window.location.hash.replace("#", "");
    return apps.some(app => app.id === idFromHash) ? idFromHash : "all";
}

function renderFilters(apps, activeId, onSelect) {
    const filters = [
        { id: "all", name: "전체" },
        ...apps.map(app => ({ id: app.id, name: app.name }))
    ];

    patchFilters.replaceChildren(...filters.map(filter => {
        const button = createElement("button", "patch-filter", filter.name);
        button.type = "button";
        button.classList.toggle("active", filter.id === activeId);
        button.addEventListener("click", () => onSelect(filter.id));
        return button;
    }));
}

function createPatchCard(app, note) {
    const card = createElement("article", "patch-card");

    const icon = document.createElement("img");
    icon.className = "patch-icon";
    icon.src = app.icon;
    icon.alt = `${app.name} 앱 아이콘`;
    card.appendChild(icon);

    const content = createElement("div", "patch-content");

    const meta = createElement("div", "patch-meta");
    meta.appendChild(createElement("span", "patch-chip", app.category));
    meta.appendChild(createElement("span", "patch-chip", note.version));
    meta.appendChild(createElement("span", "patch-chip", note.date));
    content.appendChild(meta);

    content.appendChild(createElement("h2", "", app.name));
    content.appendChild(createElement("h3", "", note.title));
    content.appendChild(createElement("p", "", note.summary));

    const changes = createElement("ul", "");
    changes.replaceChildren(...note.changes.map(change => createElement("li", "", change)));
    content.appendChild(changes);

    card.id = app.id;
    card.appendChild(content);
    return card;
}

function getNoteTimestamp(note) {
    const normalizedDate = note.date
        .replace(" 예정", "")
        .replace(/\./g, "-");
    const timestamp = Date.parse(normalizedDate);
    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function renderPatchNotes(apps, activeId) {
    const visibleApps = activeId === "all"
        ? apps
        : apps.filter(app => app.id === activeId);

    const notes = visibleApps
        .flatMap(app => app.notes.map(note => ({ app, note })))
        .sort((a, b) => getNoteTimestamp(b.note) - getNoteTimestamp(a.note));

    const cards = notes.map(({ app, note }) => createPatchCard(app, note));
    patchList.replaceChildren(...cards);
}

async function initPatchNotes() {
    try {
        if (window.location.protocol === "file:") {
            throw new Error("Patch notes cannot be loaded from file://. Use a local web server.");
        }

        const response = await fetch("data/patch-notes.json", { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Failed to load patch-notes.json: ${response.status}`);
        }

        const data = await response.json();
        const apps = data.apps || [];
        let activeId = getInitialFilter(apps);

        const selectFilter = id => {
            activeId = id;
            if (id === "all") {
                history.replaceState(null, "", "patch-notes.html");
            } else {
                history.replaceState(null, "", `#${id}`);
            }
            renderFilters(apps, activeId, selectFilter);
            renderPatchNotes(apps, activeId);
        };

        renderFilters(apps, activeId, selectFilter);
        renderPatchNotes(apps, activeId);
    } catch (error) {
        console.error(error);
        const message = window.location.protocol === "file:"
            ? "패치노트는 로컬 서버로 열었을 때 표시됩니다."
            : "패치노트를 불러오지 못했습니다.";
        patchList.replaceChildren(createElement("p", "patch-load-message", message));
    }
}

initPatchNotes();
