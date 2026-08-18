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
  const galleryHtml = gallery.map((source, index) => [
    '<article class="project-media">',
    '  <img class="project-media-image" src="' + escapeAttr(source) + '" alt="' + escapeAttr(project.title) + ' - ' + (index + 1) + '" loading="' + (index === 0 ? "eager" : "lazy") + '" decoding="async" />',
    '</article>',
  ].join("\n")).join("\n");
  const previewHtml = project.mediaUrl ? [
    '<article class="project-media project-video">',
    '  <video class="project-media-video" src="' + escapeAttr(project.mediaUrl) + '" controls playsinline preload="metadata" poster="' + escapeAttr(coverImage) + '"></video>',
    '</article>',
  ].join("\n") : "";
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
    previewHtml,
    galleryHtml,
    "  </section>",
    "</div>",
  ].join("\n");
})();
