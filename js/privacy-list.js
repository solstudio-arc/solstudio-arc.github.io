async function initPrivacyList() {
    const list = document.querySelector("#privacy-app-list");

    try {
        const response = await fetch("data/app-privacy.json", { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Failed to load app-privacy.json: ${response.status}`);
        }

        const data = await response.json();
        const links = (data.apps || []).map(app => {
            const link = document.createElement("a");
            link.className = "app-policy-link";
            link.href = `privacy_app.html?id=${encodeURIComponent(app.id)}`;

            const icon = document.createElement("img");
            icon.src = app.icon;
            icon.alt = app.iconAlt || `${app.name} 앱 아이콘`;

            const content = document.createElement("span");
            const name = document.createElement("strong");
            name.textContent = app.name;
            content.append(name, document.createTextNode((app.chips || []).join(", ")));
            link.append(icon, content);
            return link;
        });

        if (links.length) {
            list.replaceChildren(...links);
        } else {
            list.textContent = "등록된 앱별 개인정보처리방침이 없습니다.";
        }
    } catch (error) {
        console.error(error);
        list.textContent = "앱별 개인정보처리방침을 불러오지 못했습니다.";
    }
}

initPrivacyList();
