(function () {
  const root = document.getElementById("portfolio-list-grid");
  const filterRoot = document.getElementById("portfolio-filter-bar");
  const projects = Array.isArray(window.PROJECT_DATA) ? window.PROJECT_DATA : [];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointerFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (!root || !filterRoot) return;

  const filters = ["All", "UI Design", "Mobile Design", "Web Design", "Data visualization", "Motion Effect Design"];
  const featuredOrder = [
    "personnel-logistics-management-system",
    "human-resources-management-system",
    "petro-mesh-international-dmcc",
  ];

  const wallImages = {
    "personnel-logistics-management-system": "../assets/project-wall/1.webp",
    "petro-mesh-international-dmcc": "../assets/project-wall/2.webp",
    "personnel-positioning-system": "../assets/project-wall/3.webp",
    "smart-park-management-system": "../assets/project-wall/4.webp",
    "human-resources-management-system": "../assets/project-wall/5.webp",
    "customer-management-system": "../assets/project-wall/6.webp",
  };

  const projectMeta = {
    "personnel-logistics-management-system": {
      title: "智慧换电APP重构",
      category: "UI Design",
      tags: ["UI Design"],
      description: "该智慧换电平台面向电动车用户及即时配送人员，提供高效的能源补给解决方案。通过“车-电-柜”一体化服务模式，覆盖商圈、社区及配送站等多场景。用户可通过APP实现自助换电与调度协同，降低充电时间与成本，提升安全性与便利性，优化整体补能体验。",
    },
    "petro-mesh-international-dmcc": {
      title: "Petro Mesh International DMCC",
      category: "Web Design",
      tags: ["Web Design"],
      description: "A corporate website experience for an international energy trading business, focused on capability, trust, and global reach.",
    },
    "personnel-positioning-system": {
      title: "Personnel positioning system",
      category: "Data visualization",
      tags: ["Web Design", "Data visualization"],
      description: "A real-time positioning dashboard that brings map views, movement trails, area status, and safety alerts into one workflow.",
    },
    "smart-park-management-system": {
      title: "Smart park management system",
      category: "Data visualization",
      tags: ["Data visualization"],
      description: "A smart park monitoring dashboard for visitor distribution, regional status, operational metrics, and risk awareness.",
    },
    "human-resources-management-system": {
      title: "Human resources management system",
      category: "Web Design",
      tags: ["Web Design"],
      description: "An HR operations system covering organization structure, employee records, approval flows, and management statistics.",
    },
    "customer-management-system": {
      title: "Customer management system",
      category: "Web Design",
      tags: ["Web Design"],
      description: "A customer relationship management interface for profiles, communication records, sales leads, and follow-up tasks.",
    },
  };

  let activeFilter = "All";

  const getProjectTags = (project) => {
    const meta = projectMeta[project.slug] || {};
    return meta.tags || project.tags || [meta.category || project.category];
  };

  const getOrderedProjects = () =>
    projects
      .slice()
      .sort(function (left, right) {
        const leftIndex = featuredOrder.indexOf(left.slug);
        const rightIndex = featuredOrder.indexOf(right.slug);
        if (leftIndex === -1 && rightIndex === -1) return 0;
        if (leftIndex === -1) return 1;
        if (rightIndex === -1) return -1;
        return leftIndex - rightIndex;
      });

  const getVisibleProjects = () => {
    const ordered = getOrderedProjects();
    if (activeFilter === "All") return ordered;
    return ordered.filter(function (project) {
      return getProjectTags(project).includes(activeFilter);
    });
  };

  const escapeAttr = (value) => String(value || "").replace(/"/g, "&quot;");

  const renderFilters = () => {
    filterRoot.innerHTML = [
      '<div class="portfolio-filters">',
      filters
        .map(function (filter, index) {
          return [
            '<button class="portfolio-filter' + (filter === activeFilter ? " is-active" : "") + '" type="button" data-filter="' + escapeAttr(filter) + '">',
            filter,
            "</button>",
            index < filters.length - 1 ? '<span class="portfolio-filter-separator" aria-hidden="true"></span>' : "",
          ].join("");
        })
        .join(""),
      "</div>",
    ].join("");
  };

  const revealCards = () => {
    const cards = root.querySelectorAll(".portfolio-project");

    if (reduceMotion || !("IntersectionObserver" in window)) {
      cards.forEach(function (card) {
        card.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    cards.forEach(function (card) {
      observer.observe(card);
    });
  };

  const resetDock = (node, prefix) => {
    node.style.setProperty("--" + prefix + "-x", "0px");
    node.style.setProperty("--" + prefix + "-y", "0px");
    node.style.setProperty("--" + prefix + "-scale", "1");
  };

  const updateDock = (node, event, prefix, bound, forceX, forceY, scaleForce) => {
    if (!pointerFine || reduceMotion) return;

    const rect = node.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = event.clientX - centerX;
    const deltaY = event.clientY - centerY;
    const distance = Math.hypot(deltaX, deltaY);
    const limit = Math.max(rect.width, rect.height) * bound;
    const proximity = Math.max(0, 1 - distance / limit);

    node.style.setProperty("--" + prefix + "-x", ((deltaX / rect.width) * forceX * proximity).toFixed(2) + "px");
    node.style.setProperty("--" + prefix + "-y", ((deltaY / rect.height) * forceY * proximity).toFixed(2) + "px");
    node.style.setProperty("--" + prefix + "-scale", (1 + scaleForce * proximity).toFixed(3));
  };

  const initDocks = () => {
    root.querySelectorAll(".portfolio-project-image-dock").forEach(function (dock) {
      dock.addEventListener("pointermove", function (event) {
        updateDock(dock, event, "project-image-dock", 0.72, 16, 14, 0.065);
      });
      dock.addEventListener("pointerleave", function () {
        resetDock(dock, "project-image-dock");
      });
    });

    root.querySelectorAll(".portfolio-project-cta-dock").forEach(function (dock) {
      dock.addEventListener("pointermove", function (event) {
        updateDock(dock, event, "project-cta-dock", 1.25, 20, 11, 0.085);
      });
      dock.addEventListener("pointerleave", function () {
        resetDock(dock, "project-cta-dock");
      });
    });
  };

  const renderProjects = () => {
    const visibleProjects = getVisibleProjects();

    if (visibleProjects.length === 0) {
      root.innerHTML = [
        '<div class="portfolio-empty-state">',
        "  <p>No projects in this category yet.</p>",
        "</div>",
      ].join("\n");
      return;
    }

    root.innerHTML = visibleProjects
      .map(function (project, index) {
        const meta = projectMeta[project.slug] || {};
        const imageSrc = wallImages[project.slug] || project.cover;
        const tags = getProjectTags(project);
        const title = meta.title || project.title;
        const description = meta.description || project.descriptionZh || "";
        const isReversed = index % 2 === 1;

        return [
          '<article class="portfolio-project' + (isReversed ? " is-reversed" : "") + '" style="--item-delay: ' + index * 90 + 'ms">',
          '  <a class="portfolio-project-image-dock" href="./project-detail.html?slug=' + project.slug + '" aria-label="View ' + escapeAttr(title) + ' project">',
          '    <img class="portfolio-project-image" src="' + imageSrc + '" alt="' + escapeAttr(title) + ' - Desktop view" loading="' + (index === 0 ? "eager" : "lazy") + '" decoding="async" />',
          "  </a>",
          '  <div class="portfolio-project-details">',
          '    <div class="portfolio-project-tags">',
          '      <span class="portfolio-project-tag-icon" aria-hidden="true"></span>',
          tags
            .map(function (tag) {
              return '<span class="portfolio-project-tag">' + tag + "</span>";
            })
            .join(""),
          "    </div>",
          '    <div class="portfolio-project-title-row">',
          '      <h2 class="portfolio-project-title">' + title + "</h2>",
          '      <a class="portfolio-project-open" href="./project-detail.html?slug=' + project.slug + '" aria-label="Open ' + escapeAttr(title) + '">↗</a>',
          "    </div>",
          '    <p class="portfolio-project-copy">' + description + "</p>",
          '    <div class="portfolio-project-cta-wrap">',
          '      <a class="portfolio-project-cta-dock" href="./project-detail.html?slug=' + project.slug + '">',
          "        <span>View Project</span>",
          "        <span aria-hidden=\"true\">↗</span>",
          "      </a>",
          "    </div>",
          "  </div>",
          "</article>",
        ].join("\n");
      })
      .join("\n");

    revealCards();
    initDocks();
  };

  filterRoot.addEventListener("click", function (event) {
    const button = event.target.closest ? event.target.closest("[data-filter]") : null;
    if (!button) return;

    activeFilter = button.dataset.filter || "All";
    renderFilters();
    renderProjects();
  });

  renderFilters();
  renderProjects();
})();
