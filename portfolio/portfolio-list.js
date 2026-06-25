(function () {
  const root = document.getElementById("portfolio-list-grid");
  const projects = Array.isArray(window.PROJECT_DATA) ? window.PROJECT_DATA : [];

  if (!root) return;

  const wallImages = {
    "personnel-logistics-management-system": "../assets/project-wall/1.png",
    "petro-mesh-international-dmcc": "../assets/project-wall/2.png",
    "personnel-positioning-system": "../assets/project-wall/3.png",
    "smart-park-management-system": "../assets/project-wall/4.png",
    "human-resources-management-system": "../assets/project-wall/5.png",
    "customer-management-system": "../assets/project-wall/6.png",
  };

  root.innerHTML = projects
    .map(function (project) {
      const imageSrc = wallImages[project.slug] || project.cover;
      const tags = Array.isArray(project.tags) && project.tags.length ? project.tags : [project.category];

      return [
        '<a class="portfolio-card" href="./project-detail.html?slug=' + project.slug + '">',
        '  <div class="portfolio-card-image">',
        '    <img src="' + imageSrc + '" alt="' + project.title.replace(/"/g, "&quot;") + '" loading="lazy" decoding="async" />',
        "  </div>",
        '  <div class="portfolio-card-meta">',
        '    <h2 class="portfolio-card-title">' + project.title + "</h2>",
        '    <p class="portfolio-card-tag">' + tags.join(" / ") + "</p>",
        "  </div>",
        "</a>",
      ].join("\n");
    })
    .join("\n");
})();
