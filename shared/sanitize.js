(function () {
  const htmlEntities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => htmlEntities[character]);
  const escapeAttr = escapeHtml;

  const normalizeUrl = (value) => String(value ?? "").trim().replace(/[\u0000-\u001f\u007f]/g, "");
  const safeUrl = (value, options) => {
    const settings = { allowHash: true, allowRelative: true, protocols: ["http:", "https:", "mailto:", "tel:"], ...(options || {}) };
    const source = normalizeUrl(value);
    if (!source || /^\/\//.test(source)) return "";
    if (source.startsWith("#")) return settings.allowHash ? source : "";
    const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(source);
    if (!hasScheme) return settings.allowRelative && !source.startsWith("\\") ? source : "";
    try {
      const parsed = new URL(source, document.baseURI);
      return settings.protocols.includes(parsed.protocol.toLowerCase()) ? source : "";
    } catch (error) {
      return "";
    }
  };

  const safeImageUrl = (value) => {
    const source = normalizeUrl(value);
    if (/^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z\d+/=]+$/i.test(source)) return source;
    if (/^blob:/i.test(source)) return source;
    return safeUrl(source, { allowHash: false, protocols: ["http:", "https:"] });
  };

  const sanitizeInlineHtml = (value) => {
    const root = value && value.nodeType
      ? value.cloneNode(true)
      : new DOMParser().parseFromString('<div id="sanitize-root">' + String(value || "") + "</div>", "text/html").getElementById("sanitize-root");
    const allowedTags = new Set(["B", "STRONG", "I", "EM", "U", "S", "A", "BR"]);
    Array.from(root.querySelectorAll("*")).reverse().forEach((element) => {
      if (!allowedTags.has(element.tagName)) {
        element.replaceWith(...element.childNodes);
        return;
      }
      const href = element.tagName === "A" ? safeUrl(element.getAttribute("href"), { allowRelative: false }) : "";
      const title = element.tagName === "A" ? String(element.getAttribute("title") || "").slice(0, 200) : "";
      Array.from(element.attributes).forEach((attribute) => element.removeAttribute(attribute.name));
      if (element.tagName === "A") {
        if (!href) {
          element.replaceWith(...element.childNodes);
          return;
        }
        element.setAttribute("href", href);
        if (title) element.setAttribute("title", title);
        element.setAttribute("rel", "noopener noreferrer");
      }
    });
    return root.innerHTML;
  };

  window.PortfolioSanitize = { escapeHtml, escapeAttr, safeUrl, safeImageUrl, sanitizeInlineHtml };
})();
