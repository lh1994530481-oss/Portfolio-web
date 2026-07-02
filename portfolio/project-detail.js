(function () {
  const root = document.getElementById("project-detail-root");
  const projects = Array.isArray(window.PROJECT_DATA) ? window.PROJECT_DATA : [];
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
  const coverImage = wallImages[project.slug] || project.cover;
  const mediaHtml = [
    '<article class="project-media">',
    '  <img class="project-media-image" src="' + coverImage + '" alt="' + escapeAttr(project.title) + '" loading="eager" decoding="async" />',
    "</article>",
  ].join("\n");

  root.innerHTML = [
    '<div class="project-shell">',
    '  <a class="project-back" href="' + escapeAttr(backHref) + '" data-transition-restore="true" aria-label="Back to portfolio">Back</a>',
    '  <section class="project-hero">',
    '    <div class="project-inner">',
    '      <h1 class="project-title">' + project.title + "</h1>",
    '      <div class="project-tags">' +
      tags
        .map(function (tag) {
          return '<span class="project-tag">' + tag + "</span>";
        })
        .join("") +
      "</div>",
    '      <p class="project-description">' + project.descriptionZh + "</p>",
    "    </div>",
    "  </section>",
    '  <section class="project-gallery" id="project-gallery">',
    mediaHtml,
    "  </section>",
    "</div>",
  ].join("\n");
})();
