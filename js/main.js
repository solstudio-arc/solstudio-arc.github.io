/* ==========================
   NAVBAR SCROLL EFFECT
========================== */
const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {
    if (window.scrollY > 10) {
        navbar.classList.add("scrolled");
    } else {
        navbar.classList.remove("scrolled");
    }
});

/* ==========================
   SMOOTH ACTIVE NAV HIGHLIGHT
========================== */
const sections = document.querySelectorAll("section");
const navLinks = document.querySelectorAll(".navbar a");

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            navLinks.forEach(link => {
                link.classList.remove("active");

                if (link.getAttribute("href").replace("#", "") === entry.target.id) {
                    link.classList.add("active");
                }
            });
        }
    });
}, {
    threshold: 0.4
});

sections.forEach(section => observer.observe(section));

/* ==========================
   APP CARD RENDERING
========================== */
const appLists = document.querySelectorAll("[data-app-list]");
const statNumbers = document.querySelectorAll("[data-stat-count]");
const updateRoadmap = document.querySelector("#update-roadmap");

function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
        element.className = className;
    }
    element.textContent = text;
    return element;
}

function createAppIcon(app) {
    const wrapper = document.createElement("div");
    wrapper.className = "icon-wrapper";

    if (app.icon) {
        const icon = document.createElement("img");
        icon.className = "app-icon";
        icon.src = app.icon;
        icon.alt = `${app.name} 앱 아이콘`;
        wrapper.appendChild(icon);
        return wrapper;
    }

    const placeholder = document.createElement("div");
    placeholder.className = "app-icon app-icon-placeholder";
    placeholder.textContent = app.placeholderText || app.name.charAt(0);
    wrapper.appendChild(placeholder);

    return wrapper;
}

function createAppCard(app) {
    const isEnabled = Boolean(app.url);
    const card = document.createElement(isEnabled ? "a" : "div");
    card.className = isEnabled ? "app-card" : "app-card disabled";

    if (isEnabled) {
        card.href = app.url;
        card.target = "_blank";
        card.rel = "noopener noreferrer";
    }

    const accent = document.createElement("div");
    accent.className = "card-accent";
    card.appendChild(accent);

    const top = document.createElement("div");
    top.className = "card-top";
    top.appendChild(createTextElement("div", "card-category", app.category));

    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.appendChild(createTextElement("span", "", app.status));
    meta.appendChild(createTextElement("strong", "", app.date));
    top.appendChild(meta);
    card.appendChild(top);

    const main = document.createElement("div");
    main.className = "card-main";
    main.appendChild(createAppIcon(app));

    const content = document.createElement("div");
    content.className = "card-content";

    const titleRow = document.createElement("div");
    titleRow.className = "card-title-row";
    titleRow.appendChild(createTextElement("h3", "", app.name));

    if (app.patchNotesUrl) {
        const patchLink = document.createElement("span");
        patchLink.className = "patch-note-link";
        patchLink.role = "link";
        patchLink.tabIndex = 0;
        patchLink.textContent = "패치노트";
        patchLink.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            window.location.href = app.patchNotesUrl;
        });
        patchLink.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                window.location.href = app.patchNotesUrl;
            }
        });
        titleRow.appendChild(patchLink);
    }

    content.appendChild(titleRow);

    const description = document.createElement("p");
    (app.description || []).forEach((line, index) => {
        if (index > 0) {
            description.appendChild(document.createElement("br"));
        }
        description.appendChild(document.createTextNode(line));
    });
    content.appendChild(description);

    main.appendChild(content);
    card.appendChild(main);

    if (isEnabled && app.storeBadge) {
        const bottom = document.createElement("div");
        bottom.className = "card-bottom";

        if (isEnabled && app.storeBadge) {
            const storeInfo = document.createElement("div");
            storeInfo.className = "store-info";

            const badge = document.createElement("img");
            badge.className = "store-badge";
            badge.src = app.storeBadge;
            badge.alt = "Google Play에서 다운로드";
            storeInfo.appendChild(badge);

            storeInfo.appendChild(createTextElement("div", "arrow", "→"));
            bottom.appendChild(storeInfo);
        }

        card.appendChild(bottom);
    }

    return card;
}

async function renderAppLists() {
    try {
        const appInfo = await loadAppInfo();
        renderStats(appInfo);
        renderAppCards(appInfo);
        renderUpdateRoadmap();
    } catch (error) {
        console.error(error);

        appLists.forEach(list => {
            const message = document.createElement("p");
            message.className = "app-load-message";
            message.textContent = window.location.protocol === "file:"
                ? "앱 정보는 로컬 서버로 열었을 때 표시됩니다."
                : "앱 정보를 불러오지 못했습니다.";
            list.replaceChildren(message);
        });
    }
}

async function loadAppInfo() {
    if (window.location.protocol === "file:") {
        throw new Error("App data cannot be loaded from file://. Use a local web server.");
    }

    const response = await fetch("data/app-info.json", { cache: "no-store" });
    if (!response.ok) {
        throw new Error(`Failed to load app-info.json: ${response.status}`);
    }

    return response.json();
}

function getAppStats(appInfo) {
    return {
        released: (appInfo.released || []).length,
        development: (appInfo.development || []).length,
        rnd: (appInfo.rnd || []).length
    };
}

function renderStats(appInfo) {
    const stats = getAppStats(appInfo);

    statNumbers.forEach(stat => {
        const statName = stat.dataset.statCount;
        stat.textContent = stats[statName] ?? 0;
        observeCounter(stat);
    });
}

function renderAppCards(appInfo) {
    appLists.forEach(list => {
        const listName = list.dataset.appList;
        const apps = appInfo[listName] || [];
        if (apps.length) {
            list.replaceChildren(...apps.map(createAppCard));
        } else {
            list.replaceChildren(createTextElement("p", "app-load-message", "아직 표시할 앱이 없습니다."));
        }
    });
}

async function loadPatchNotes() {
    const response = await fetch("data/patch-notes.json", { cache: "no-store" });
    if (!response.ok) {
        throw new Error(`Failed to load patch-notes.json: ${response.status}`);
    }

    return response.json();
}

function parsePatchDate(dateText) {
    const match = (dateText || "").match(/(\d{4})\.(\d{2})\.(\d{2})/);
    if (!match) {
        return null;
    }

    return new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00`);
}

function isPlannedNote(note) {
    return (note.date || "").includes("예정")
        || (note.date || "").includes("미정")
        || (note.title || "").includes("예정");
}

function getRoadmapProgress(noteDate, planned) {
    if (!noteDate) {
        return planned ? 18 : 100;
    }

    if (!planned) {
        return 100;
    }

    const now = new Date();
    const windowStart = new Date(noteDate);
    windowStart.setDate(windowStart.getDate() - 14);
    const total = noteDate - windowStart;
    const elapsed = now - windowStart;
    const progress = Math.round((elapsed / total) * 100);

    return Math.min(96, Math.max(12, progress));
}

function getRoadmapItems(patchData) {
    const items = (patchData.apps || [])
        .map(app => (app.notes || [])
            .filter(note => note.draft !== true && note.type !== "creator")
            .map(note => {
                const noteDate = parsePatchDate(note.date);
                const planned = isPlannedNote(note);

                return {
                    app,
                    note,
                    noteDate,
                    planned,
                    timestamp: noteDate ? noteDate.getTime() : Number.MAX_SAFE_INTEGER
                };
            })
            .sort((a, b) => b.timestamp - a.timestamp)[0])
        .filter(Boolean);

    return items.sort((a, b) => {
        if (!a.noteDate && !b.noteDate) {
            return a.app.name.localeCompare(b.app.name, "ko");
        }

        if (!a.noteDate) {
            return 1;
        }

        if (!b.noteDate) {
            return -1;
        }

        return b.timestamp - a.timestamp;
    });
}

function createRoadmapItem(item) {
    const link = document.createElement("a");
    link.className = "roadmap-item";
    link.href = `patch-notes.html#${item.app.id}`;

    const appCell = document.createElement("div");
    appCell.className = "roadmap-app";

    if (item.app.icon) {
        const icon = document.createElement("img");
        icon.className = "roadmap-icon";
        icon.src = item.app.icon;
        icon.alt = `${item.app.name} 앱 아이콘`;
        appCell.appendChild(icon);
    }

    const appText = document.createElement("div");
    appText.appendChild(createTextElement("strong", "", item.app.name));
    appText.appendChild(createTextElement("span", "", item.note.version));
    appCell.appendChild(appText);

    const titleCell = document.createElement("div");
    titleCell.className = "roadmap-title";
    titleCell.appendChild(createTextElement("strong", "", item.note.title));
    titleCell.appendChild(createTextElement("span", "", item.note.summary || ""));

    const dateCell = document.createElement("div");
    dateCell.className = "roadmap-date";

    const dateRow = document.createElement("div");
    dateRow.className = "roadmap-date-row";
    dateRow.appendChild(createTextElement("span", "", item.note.date));
    dateRow.appendChild(createTextElement("strong", item.planned ? "roadmap-chip" : "roadmap-chip done", item.planned ? "예정" : "완료"));
    dateCell.appendChild(dateRow);

    const track = document.createElement("div");
    track.className = "roadmap-track";
    const progress = document.createElement("span");
    progress.className = item.planned ? "roadmap-progress" : "roadmap-progress done";
    progress.style.setProperty("--progress", `${getRoadmapProgress(item.noteDate, item.planned)}%`);
    track.appendChild(progress);
    dateCell.appendChild(track);

    link.append(appCell, titleCell, dateCell);
    return link;
}

async function renderUpdateRoadmap() {
    if (!updateRoadmap) {
        return;
    }

    try {
        const patchData = await loadPatchNotes();
        const items = getRoadmapItems(patchData);

        if (!items.length) {
            updateRoadmap.replaceChildren(createTextElement("p", "roadmap-empty", "표시할 업데이트 일정이 없습니다."));
            return;
        }

        updateRoadmap.replaceChildren(...items.map(createRoadmapItem));
    } catch (error) {
        console.error(error);
        updateRoadmap.replaceChildren(createTextElement("p", "roadmap-empty", "업데이트 일정을 불러오지 못했습니다."));
    }
}

/* ==========================
   FADE IN ON SCROLL
========================== */
const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("show");
        }
    });
}, {
    threshold: 0.15
});

function observeFadeElements() {
    const fadeEls = document.querySelectorAll(
        ".app-card, .about-card, .roadmap-item, .contact-card > div"
    );

    fadeEls.forEach(el => {
        if (el.dataset.fadeObserved) {
            return;
        }

        el.dataset.fadeObserved = "true";
        el.classList.add("fade-init");
        fadeObserver.observe(el);
    });
}

/* ==========================
   NUMBER COUNT ANIMATION
========================== */
const counters = document.querySelectorAll(".stat-number");
const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const target = +el.textContent;
            let current = 0;
            const step = Math.max(1, Math.floor(target / 30));
            const interval = setInterval(() => {
                current += step;
                if (current >= target) {
                    el.textContent = target;
                    clearInterval(interval);
                } else {
                    el.textContent = current;
                }
            }, 30);
            countObserver.unobserve(el);
        }
    });
}, {
    threshold: 0.6
});

function observeCounter(counter) {
    countObserver.unobserve(counter);
    countObserver.observe(counter);
}

counters.forEach(counter => {
    if (!counter.dataset.statCount) {
        observeCounter(counter);
    }
});

/* ==========================
   SMOOTH SCROLL OFFSET FIX
========================== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));

        if (target) {
            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
});

renderAppLists().finally(observeFadeElements);
