(function () {
  const root = document.getElementById("portfolio-list-grid");
  const filterRoot = document.getElementById("portfolio-filter-bar");
  const projects = Array.isArray(window.PROJECT_DATA) ? window.PROJECT_DATA : [];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointerFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (!root || !filterRoot) return;

  const filters = ["All", "APP Design", "Web Design", "Data visualization", "IP Design", "Exercises and Demos"];
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
      category: "APP Design",
      tags: ["APP Design"],
      description: "该项目针对骑手及大众用户在户外、弱网、低电量等极端场景下的急迫换电痛点进行全盘重塑。重构设计以“地图找柜”为核心视觉中枢，全面优化核心换电与路线导航链路。通过建立高亮度的户外视觉规范，实现信息的高效过滤与极速闭环，大幅缩减用户的街头决策时间，让换电体验更直观、更安全。",
    },
    "petro-mesh-international-dmcc": {
      title: "GoMenu 智能餐饮消费客户端",
      category: "APP Design",
      tags: ["APP Design"],
      description: "该项目聚焦于打造端到端的极致就餐与会员复购体验。设计打破传统点餐软件的繁琐流程，深度打通智能推荐、动态库存联动与精细化会员营销（CRM）。界面采用极简降噪的视觉美学与丝滑的微动效引导，贯穿用户从入座、点单、结账到售后评价的全生命周期，以无感的流畅交互赋能品牌客单价与留存率的双向增长。",
    },
    "personnel-positioning-system": {
      title: "ATN 智慧换电实时资产看板",
      category: "Data visualization",
      tags: ["Data visualization"],
      description: "该项目专为大中型城市换电网络的宏观调度、资产监控与网点运维打造。设计深入电柜潮汐预测、电池健康度（SOH）跟踪、故障秒级预警等核心协同场景。视觉上采用极具科技感的暗调数字孪生风格，将复杂的物联大数据进行结构化分级与空间映射，帮助管理层摆脱数据孤岛，实现“信息主动找人”的高效决策响应。",
    },
    "smart-park-management-system": {
      title: "IP 设计",
      category: "IP Design",
      tags: ["IP Design"],
      description: "该项目为个人使用ai的练习ip设计",
    },
    "human-resources-management-system": {
      title: "GoMenu 餐饮数字化经营系统",
      category: "Web Design",
      tags: ["Web Design"],
      description: "该项目致力于重构传统餐饮的底层协同架构与门店资产链路。设计围绕多渠道聚合点餐、后厨 KDS 智能分单、多店收银及全链路供应链管理展开。通过建立规范的数据底层模型与强对比度的卡片式视觉规范，消除高频、快节奏场景下的信息冗余，在实现秒级多端同步的同时，用数字化手段为连锁餐饮企业沉淀核心经营资产。",
    },
    "customer-management-system": {
      title: "一竺自助讲解小程序",
      category: "APP Design",
      tags: ["APP Design"],
      description: "景区自助讲解器",
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
