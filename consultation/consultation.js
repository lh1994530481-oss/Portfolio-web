(async function () {
  const api = window.ContentAPI;
  if (!api) return;

  const safeHref = (value) => {
    const href = String(value || "").trim();
    const protocolCandidate = href.replace(/[\u0000-\u0020]/g, "");
    if (/^(?:javascript|data|vbscript):/i.test(protocolCandidate)) return "#";
    if (href === "#top") return "../index.html#top";
    if (href === "#contact") return "../index.html#contact";
    if (href === "./consultation/index.html") return "./index.html";
    if (href.startsWith("./")) return "../" + href.slice(2);
    return href || "#";
  };

  try {
    const [settings, navigation] = await Promise.all([
      api.getSettings(),
      api.listNavigation(api.defaultNavigation, false),
    ]);

    const navigationRoot = document.querySelector("[data-managed-navigation]");
    if (navigationRoot) {
      const fragment = document.createDocumentFragment();
      navigation.forEach((item) => {
        const link = document.createElement("a");
        const isActive = item.label === "咨询" || item.href === "./consultation/index.html";
        link.className = "nav-link" + (isActive ? " is-active" : "");
        link.href = safeHref(item.href);
        link.textContent = item.label;
        if (isActive) link.setAttribute("aria-current", "page");
        if (item.openNewTab) {
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        }
        fragment.appendChild(link);
      });
      navigationRoot.replaceChildren(fragment);
    }

    document.querySelectorAll("[data-content]").forEach((node) => {
      const value = settings[node.dataset.content];
      if (value) node.textContent = value;
    });

    document.querySelectorAll("[data-content-mail]").forEach((node) => {
      const value = settings[node.dataset.contentMail];
      if (value) node.href = "mailto:" + value;
    });
  } catch (error) {
    document.body.dataset.contentState = "fallback";
  }
})();