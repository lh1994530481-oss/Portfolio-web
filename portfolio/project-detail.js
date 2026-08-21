(async function () {
  const root = document.getElementById("project-detail-root");
  const fallbackProjects = Array.isArray(window.PROJECT_DATA) ? window.PROJECT_DATA : [];
  const projects = window.ContentAPI
    ? await window.ContentAPI.listProjects(fallbackProjects, false)
    : fallbackProjects;
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const fallbackBackHref = "../index.html#portfolio";
  const wallImages = {
    "personnel-logistics-management-system": "../assets/project-wall/1.webp",
    "petro-mesh-international-dmcc": "../assets/project-wall/2.webp",
    "personnel-positioning-system": "../assets/project-wall/3.webp",
    "smart-park-management-system": "../assets/project-wall/4.webp",
    "human-resources-management-system": "../assets/project-wall/5.webp",
    "customer-management-system": "../assets/project-wall/6.webp",
  };

  const escapeAttr = (value) => String(value || "").replace(/"/g, "&quot;");
  const escapeHtml = (value) => String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const sanitizeInlineHtml = (value) => {
    const node = document.createElement("div");
    node.innerHTML = String(value || "");
    const allowed = new Set(["B", "STRONG", "I", "EM", "U", "S", "A", "BR"]);
    Array.from(node.querySelectorAll("*")).reverse().forEach((element) => {
      if (!allowed.has(element.tagName)) {
        element.replaceWith(...element.childNodes);
        return;
      }
      const href = element.tagName === "A" ? element.getAttribute("href") || "" : "";
      Array.from(element.attributes).forEach((attribute) => element.removeAttribute(attribute.name));
      if (element.tagName === "A") {
        if (/^(https?:|mailto:|#|\.\.?\/)/i.test(href)) {
          element.setAttribute("href", href);
          element.setAttribute("rel", "noopener noreferrer");
        } else element.replaceWith(...element.childNodes);
      }
    });
    return node.innerHTML;
  };

  const getBackHref = () => {
    try {
      const state = JSON.parse(window.sessionStorage.getItem("portfolio:returnTarget") || "null");
      if (state && state.href) {
        return state.href;
      }
    } catch (error) {
      // Fall back to the home project wall.
    }

    return fallbackBackHref;
  };

  if (!root) return;

  const project = projects.find((item) => item.slug === slug);

  if (!project) {
    document.title = "Project not found";
    root.innerHTML = [
      '<div class="project-missing">',
      '  <div class="project-missing-card">',
      "    <h1>Project not found</h1>",
      "    <p>This project is not available locally yet. Go back to the project wall and keep browsing.</p>",
      '    <a href="' + escapeAttr(getBackHref()) + '" data-transition-restore="true">Back</a>',
      "  </div>",
      "</div>",
    ].join("\n");
    return;
  }

  document.title = project.title + " | Portfolio";
  const backHref = getBackHref();

  const tags = Array.from(new Set(project.tags && project.tags.length ? project.tags : [project.category]));
  const coverImage = project.cover || wallImages[project.slug];
  const gallery = project.gallery && project.gallery.length
    ? project.gallery
    : project.media && project.media.length
      ? project.media.filter((item) => item.type === "image").map((item) => item.src)
      : [coverImage];
  const contentBlocks = Array.isArray(project.contentBlocks) && project.contentBlocks.length
    ? project.contentBlocks
    : [
        ...(project.mediaUrl ? [{ type: "video", src: project.mediaUrl }] : []),
        ...gallery.map((src) => ({ type: "image", src })),
      ];
  const projectContentHtml = contentBlocks.map((block, index) => {
    if (block.type === "heading") return '<h2 class="project-content-heading">' + escapeHtml(block.text || "") + '</h2>';
    if (block.type === "paragraph") return '<p class="project-content-copy">' + sanitizeInlineHtml(block.html || escapeHtml(block.text || "")) + '</p>';
    if (block.type === "video" && block.src) return [
      '<article class="project-media project-video">',
      '  <video class="project-media-video" src="' + escapeAttr(block.src) + '" controls playsinline preload="metadata" poster="' + escapeAttr(coverImage) + '"></video>',
      block.caption ? '  <p class="project-media-caption">' + escapeHtml(block.caption) + '</p>' : "",
      '</article>',
    ].join("\n");
    if (block.type === "image" && block.src) return [
      '<article class="project-media">',
      '  <img class="project-media-image" src="' + escapeAttr(block.src) + '" alt="' + escapeAttr(block.alt || block.caption || project.title + ' - ' + (index + 1)) + '" loading="' + (index === 0 ? "eager" : "lazy") + '" decoding="async" />',
      block.caption ? '  <p class="project-media-caption">' + escapeHtml(block.caption) + '</p>' : "",
      '</article>',
    ].join("\n");
    return "";
  }).join("\n");
  const projectFacts = [project.clientName ? "客户：" + project.clientName : "", project.projectDate ? "日期：" + project.projectDate : ""].filter(Boolean);

  root.innerHTML = [
    '<div class="project-shell">',
    '  <a class="project-back" href="' + escapeAttr(backHref) + '" data-transition-restore="true" aria-label="Back to portfolio">Back</a>',
    '  <section class="project-hero">',
    '    <div class="project-inner">',
    '      <h1 class="project-title">' + escapeHtml(project.title) + "</h1>",
    '      <div class="project-tags">' +
      tags
        .map(function (tag) {
          return '<span class="project-tag">' + escapeHtml(tag) + "</span>";
        })
        .join("") +
      "</div>",
    '      <p class="project-description">' + escapeHtml(project.descriptionZh) + "</p>",
    projectFacts.length ? '      <p class="project-facts">' + projectFacts.map(escapeHtml).join(" / ") + '</p>' : "",
    "    </div>",
    "  </section>",
    '  <section class="project-gallery" id="project-gallery">',
    projectContentHtml,
    "  </section>",
    "</div>",
  ].join("\n");
})();
