const page = document.querySelector("[data-account-delete-id]");
const params = new URLSearchParams(window.location.search);
const appId = (params.get("id") || page?.dataset.accountDeleteId || "").replaceAll("_", "-");

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

function createSection(title, children) {
    const section = createElement("section", "policy-section account-delete-section");

    const content = createElement("div", "section-content");
    content.appendChild(createElement("h2", "", title));
    content.append(...children);
    section.appendChild(content);

    return section;
}

function createBodyText(text) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const paragraph = createElement("p", "");

    if (emailPattern.test(text)) {
        const link = document.createElement("a");
        link.className = "contact-link";
        link.href = `mailto:${text}`;
        link.textContent = text;
        paragraph.append("이메일: ", link);
        return paragraph;
    }

    paragraph.textContent = text;
    return paragraph;
}

function appendParagraphFromLines(target, lines) {
    const text = lines.join(" ").trim();
    if (text) {
        target.push(createBodyText(text.replace(/^이메일:\s*/, "")));
    }
}

function appendList(target, tagName, items) {
    if (!items.length) {
        return;
    }

    const list = document.createElement(tagName);
    list.replaceChildren(...items.map(item => createElement("li", "", item)));
    target.push(list);
}

function parseBodySections(body) {
    const sections = [];
    let currentSection = null;
    let paragraphLines = [];
    let listType = null;
    let listItems = [];

    const flushParagraph = () => {
        if (currentSection) {
            appendParagraphFromLines(currentSection.children, paragraphLines);
        }
        paragraphLines = [];
    };

    const flushList = () => {
        if (currentSection && listType) {
            appendList(currentSection.children, listType, listItems);
        }
        listType = null;
        listItems = [];
    };

    const ensureSection = () => {
        if (!currentSection) {
            currentSection = { title: "안내", children: [] };
            sections.push(currentSection);
        }
    };

    (body || "").split(/\r?\n/).forEach(rawLine => {
        const line = rawLine.trim();

        if (!line) {
            flushParagraph();
            flushList();
            return;
        }

        const headingMatch = line.match(/^#\s+(.+)$/);
        if (headingMatch) {
            flushParagraph();
            flushList();
            currentSection = { title: headingMatch[1], children: [] };
            sections.push(currentSection);
            return;
        }

        ensureSection();

        const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
        if (orderedMatch) {
            flushParagraph();
            if (listType && listType !== "ul") {
                flushList();
            }
            listType = "ul";
            listItems.push(orderedMatch[1]);
            return;
        }

        const unorderedMatch = line.match(/^-\s+(.+)$/);
        if (unorderedMatch) {
            flushParagraph();
            if (listType && listType !== "ul") {
                flushList();
            }
            listType = "ul";
            listItems.push(unorderedMatch[1]);
            return;
        }

        flushList();
        paragraphLines.push(line);
    });

    flushParagraph();
    flushList();

    return sections;
}

function renderAccountDelete(app) {
    document.title = `계정 삭제 안내 - ${app.name}`;

    const icon = document.querySelector("#account-delete-icon");
    icon.src = app.icon;
    icon.alt = app.iconAlt || `${app.name} 앱 아이콘`;

    document.querySelector("#account-delete-name").textContent = app.name;
    const summary = document.querySelector("#account-delete-summary");
    summary.textContent = app.summary || "";
    summary.hidden = !app.summary;

    const card = document.querySelector("#account-delete-card");
    const sections = parseBodySections(app.body);
    const renderedSections = sections.map(section => createSection(section.title, section.children));

    if (app.updatedAt && renderedSections.length) {
        const lastContent = renderedSections[renderedSections.length - 1].querySelector(".section-content");
        lastContent.appendChild(createElement("p", "", `최종 수정일: ${app.updatedAt}`));
    }

    card.replaceChildren(...renderedSections);
}

async function initAccountDelete() {
    try {
        if (!appId) {
            throw new Error("Missing account delete app id.");
        }

        if (window.location.protocol === "file:") {
            throw new Error("Account delete data cannot be loaded from file://. Use a local web server.");
        }

        const response = await fetch("data/account-delete.json", { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Failed to load account-delete.json: ${response.status}`);
        }

        const data = await response.json();
        const app = (data.apps || []).find(item => item.id === appId);
        if (!app) {
            throw new Error(`Unknown account delete app id: ${appId}`);
        }

        renderAccountDelete(app);
    } catch (error) {
        console.error(error);
        document.querySelector("#account-delete-card").replaceChildren(
            createElement("p", "patch-load-message", "계정 삭제 안내를 불러오지 못했습니다.")
        );
    }
}

initAccountDelete();
