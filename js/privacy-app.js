const params = new URLSearchParams(window.location.search);
const appId = (params.get("id") || "").replaceAll("_", "-");

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

function renderError(message) {
    document.querySelector("#privacy-app-summary").textContent = message;
    document.querySelector("#privacy-app-card").replaceChildren(
        createElement("p", "patch-load-message", message)
    );
}

function getNextSectionNumber(card) {
    const numbers = [...card.querySelectorAll(".section-number")]
        .map(element => Number.parseInt(element.textContent, 10))
        .filter(Number.isFinite);
    const nextNumber = numbers.length ? Math.max(...numbers) + 1 : 1;
    return String(nextNumber).padStart(2, "0");
}

function createEffectiveDateSection(dateText) {
    const section = createElement("section", "policy-section");
    const number = createElement("span", "section-number", "");
    const content = createElement("div", "section-content");

    content.appendChild(createElement("h2", "", "시행일"));
    content.appendChild(createElement("p", "", `본 개인정보처리방침은 ${dateText}부터 시행됩니다.`));

    section.append(number, content);
    return section;
}

function renderPrivacyApp(app) {
    document.title = `${app.title || "개인정보처리방침"} - ${app.name}`;

    const kicker = document.querySelector("#privacy-app-kicker");
    const icon = document.querySelector("#privacy-app-icon");
    icon.src = app.icon;
    icon.alt = app.iconAlt || `${app.name} 앱 아이콘`;

    document.querySelector("#privacy-app-name").textContent = app.name;
    kicker.hidden = false;

    document.querySelector("#privacy-app-title").textContent = app.title || "개인정보처리방침";

    const summary = document.querySelector("#privacy-app-summary");
    summary.textContent = app.summary || "";
    summary.hidden = !app.summary;

    const meta = document.querySelector("#privacy-app-meta");
    const metaItems = app.chips || [];
    meta.replaceChildren(...metaItems.map(item => createElement("span", "meta-chip", item)));
    meta.hidden = !metaItems.length;

    const card = document.querySelector("#privacy-app-card");
    card.innerHTML = app.bodyHtml || "";

    if (app.updatedAt) {
        const effectiveDateSection = createEffectiveDateSection(app.updatedAt);
        effectiveDateSection.querySelector(".section-number").textContent = getNextSectionNumber(card);
        card.appendChild(effectiveDateSection);
    }
}

async function initPrivacyApp() {
    try {
        if (!appId) {
            throw new Error("Missing privacy app id.");
        }

        if (window.location.protocol === "file:") {
            throw new Error("Privacy app data cannot be loaded from file://. Use a local web server.");
        }

        const response = await fetch("data/app-privacy.json", { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Failed to load app-privacy.json: ${response.status}`);
        }

        const data = await response.json();
        const app = (data.apps || []).find(item => item.id === appId);
        if (!app) {
            throw new Error(`Unknown privacy app id: ${appId}`);
        }

        renderPrivacyApp(app);
    } catch (error) {
        console.error(error);
        renderError("개인정보처리방침을 불러오지 못했습니다.");
    }
}

initPrivacyApp();
