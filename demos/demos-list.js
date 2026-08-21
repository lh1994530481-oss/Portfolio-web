(async function () {
  const root = document.getElementById("demos-list-grid");
  const filterRoot = document.getElementById("demos-filter-bar");
  const modal = document.getElementById("demo-project-modal");
  const modalDialog = modal ? modal.querySelector(".demo-modal-dialog") : null;
  const modalMedia = document.getElementById("demo-modal-media");
  const modalTitle = document.getElementById("demo-modal-title");
  const modalDescription = document.getElementById("demo-modal-description");
  const modalCategory = document.getElementById("demo-modal-category");
  const modalTags = document.getElementById("demo-modal-tags");
  const experienceLink = document.getElementById("demo-modal-experience");
  const pageHeader = document.querySelector(".portfolio-page-header");
  const pageMain = document.querySelector(".demos-list-page");
  const fallbackProjects = Array.isArray(window.PROJECT_DATA) ? window.PROJECT_DATA : [];
  const projectRecords = window.ContentAPI
    ? await window.ContentAPI.listProjects(fallbackProjects, false)
    : fallbackProjects;
  const projects = projectRecords.filter(function (project) {
    return project.itemType === "demo" || project.slug === "homi-smart-home-prototype";
  });
  const categories = ["全部", "原型", "练习", "数字孪生"];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointerFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  let activeCategory = "全部";
  let lastFocusedElement = null;
  let lockedScrollY = 0;

  if (!root || !filterRoot || !modal || !modalDialog || !modalMedia || !modalTitle || !modalDescription || !modalCategory || !modalTags || !experienceLink) return;

  const escapeHtml = (value) => String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  const escapeAttr = escapeHtml;

  const refreshIcons = () => {
    if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
  };

  const getCategory = (project) => project.category === "Exercises and Demos" ? "原型" : (project.category || "原型");
  const getTags = (project) => {
    const tags = Array.isArray(project.tags) ? project.tags.filter(Boolean) : [];
    if (!tags.length || (tags.length === 1 && tags[0] === "Exercises and Demos")) {
      return ["智能家居", "交互原型", "场景自动化", "安防告警", "能源管理"];
    }
    return tags;
  };

  const getVisibleProjects = () => projects
    .slice()
    .sort((left, right) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0))
    .filter((project) => activeCategory === "全部" || getCategory(project) === activeCategory);

  const setPageInert = (value) => {
    if (pageHeader) pageHeader.inert = value;
    if (pageMain) pageMain.inert = value;
  };

  const renderFilters = () => {
    filterRoot.innerHTML = '<div class="portfolio-filters">' + categories.map(function (category, index) {
      return [
        '<button class="portfolio-filter' + (category === activeCategory ? ' is-active' : '') + '" type="button" data-demo-filter="' + escapeAttr(category) + '"><span>' + escapeHtml(category) + '</span></button>',
        index < categories.length - 1 ? '<span class="portfolio-filter-separator" aria-hidden="true"></span>' : '',
      ].join('');
    }).join('') + '</div>';
  };

  const resetDock = (node, prefix) => {
    node.style.setProperty('--' + prefix + '-x', '0px');
    node.style.setProperty('--' + prefix + '-y', '0px');
    node.style.setProperty('--' + prefix + '-scale', '1');
  };

  const updateDock = (node, event, prefix, bound, forceX, forceY, scaleForce) => {
    if (!pointerFine || reduceMotion) return;
    const rect = node.getBoundingClientRect();
    const deltaX = event.clientX - (rect.left + rect.width / 2);
    const deltaY = event.clientY - (rect.top + rect.height / 2);
    const proximity = Math.max(0, 1 - Math.hypot(deltaX, deltaY) / (Math.max(rect.width, rect.height) * bound));
    node.style.setProperty('--' + prefix + '-x', ((deltaX / rect.width) * forceX * proximity).toFixed(2) + 'px');
    node.style.setProperty('--' + prefix + '-y', ((deltaY / rect.height) * forceY * proximity).toFixed(2) + 'px');
    node.style.setProperty('--' + prefix + '-scale', (1 + scaleForce * proximity).toFixed(3));
  };

  const initDocks = () => {
    root.querySelectorAll('.portfolio-project-image-dock').forEach(function (dock) {
      dock.addEventListener('pointermove', (event) => updateDock(dock, event, 'project-image-dock', 0.72, 16, 14, 0.065));
      dock.addEventListener('pointerleave', () => resetDock(dock, 'project-image-dock'));
    });
    root.querySelectorAll('.portfolio-project-cta-dock').forEach(function (dock) {
      dock.addEventListener('pointermove', (event) => updateDock(dock, event, 'project-cta-dock', 1.25, 20, 11, 0.085));
      dock.addEventListener('pointerleave', () => resetDock(dock, 'project-cta-dock'));
    });
  };

  const revealCards = () => {
    const cards = root.querySelectorAll('.portfolio-project');
    if (reduceMotion || !("IntersectionObserver" in window)) {
      cards.forEach((card) => card.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    cards.forEach((card) => observer.observe(card));
  };

  const renderProjects = () => {
    const visibleProjects = getVisibleProjects();
    if (!visibleProjects.length) {
      root.innerHTML = '<div class="portfolio-empty-state"><p>该分类下暂时没有内容。</p></div>';
      return;
    }
    root.innerHTML = visibleProjects.map(function (project, index) {
      const title = project.title || '未命名演示';
      const imageSrc = project.cover || '../assets/project-wall/7.webp';
      const description = project.descriptionZh || '';
      const tags = getTags(project);
      const modalAttr = ' data-demo-modal="' + escapeAttr(project.slug) + '"';
      const reversed = index % 2 === 1;
      return [
        '<article class="portfolio-project' + (reversed ? ' is-reversed' : '') + '" style="--item-delay: ' + index * 90 + 'ms">',
        '  <a class="portfolio-project-image-dock" href="#' + escapeAttr(project.slug) + '"' + modalAttr + ' data-slug="' + escapeAttr(project.slug) + '" aria-label="查看' + escapeAttr(title) + '演示">',
        '    <img class="portfolio-project-image" src="' + escapeAttr(imageSrc) + '" alt="' + escapeAttr(title) + ' 封面" loading="' + (index === 0 ? 'eager' : 'lazy') + '" decoding="async" />',
        '  </a>',
        '  <div class="portfolio-project-details">',
        '    <div class="portfolio-project-tags"><i class="portfolio-project-tag-icon" data-lucide="orbit" aria-hidden="true"></i><span class="portfolio-project-tag">' + escapeHtml(getCategory(project)) + '</span></div>',
        '    <div class="portfolio-project-title-row"><h2 class="portfolio-project-title">' + escapeHtml(title) + '</h2><a class="portfolio-project-open" href="#' + escapeAttr(project.slug) + '"' + modalAttr + ' aria-label="查看' + escapeAttr(title) + '演示"><i data-lucide="arrow-up-right" aria-hidden="true"></i></a></div>',
        '    <p class="portfolio-project-copy">' + escapeHtml(description) + '</p>',
        '    <div class="portfolio-project-cta-wrap"><a class="portfolio-project-cta-dock" href="#' + escapeAttr(project.slug) + '"' + modalAttr + '><span>查看演示</span><i data-lucide="arrow-up-right" aria-hidden="true"></i></a></div>',
        '  </div>',
        '</article>',
      ].join('\n');
    }).join('\n');
    revealCards();
    initDocks();
    refreshIcons();
  };

  const openModal = (slug, trigger) => {
    const project = projects.find((item) => item.slug === slug);
    if (!project) return;
    const title = project.title || '演示详情';
    const cover = project.cover || '../assets/project-wall/7.webp';
    const media = project.mediaUrl
      ? '<video src="' + escapeAttr(project.mediaUrl) + '" controls playsinline preload="metadata" poster="' + escapeAttr(cover) + '"></video>'
      : '<img src="' + escapeAttr(cover) + '" alt="' + escapeAttr(title) + ' 预览" />';
    modalMedia.innerHTML = media;
    modalTitle.textContent = title;
    modalDescription.textContent = project.descriptionZh || '';
    modalCategory.textContent = getCategory(project);
    modalTags.innerHTML = getTags(project).map((tag) => '<span class="demo-modal-tag">' + escapeHtml(tag) + '</span>').join('');
    experienceLink.href = project.passwordEnabled ? '#' : (project.prototypeHref || '#');
    experienceLink.dataset.slug = project.slug;
    if (project.passwordEnabled) {
      experienceLink.dataset.protectedProject = project.slug;
      experienceLink.dataset.protectedProjectTitle = title;
      experienceLink.removeAttribute('target');
      experienceLink.removeAttribute('rel');
    } else {
      delete experienceLink.dataset.protectedProject;
      delete experienceLink.dataset.protectedProjectTitle;
      experienceLink.target = '_blank';
      experienceLink.rel = 'noopener noreferrer';
    }
    lastFocusedElement = trigger || document.activeElement;
    lockedScrollY = window.scrollY;
    document.body.style.setProperty('--portfolio-scroll-lock', '-' + lockedScrollY + 'px');
    document.body.classList.add('is-modal-open');
    setPageInert(true);
    modal.inert = false;
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('is-open');
    window.setTimeout(() => modalDialog.focus({ preventScroll: true }), reduceMotion ? 0 : 40);
    refreshIcons();
  };

  const closeModal = () => {
    if (!modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    modal.inert = true;
    setPageInert(false);
    document.body.classList.remove('is-modal-open');
    document.body.style.removeProperty('--portfolio-scroll-lock');
    window.scrollTo(0, lockedScrollY);
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus({ preventScroll: true });
    window.setTimeout(function () {
      if (!modal.classList.contains('is-open')) modalMedia.innerHTML = '';
    }, reduceMotion ? 0 : 300);
  };

  filterRoot.addEventListener('click', function (event) {
    const button = event.target.closest ? event.target.closest('[data-demo-filter]') : null;
    if (!button) return;
    activeCategory = button.dataset.demoFilter || '全部';
    renderFilters();
    renderProjects();
  });

  root.addEventListener('click', function (event) {
    const trigger = event.target.closest ? event.target.closest('[data-demo-modal]') : null;
    if (!trigger) return;
    event.preventDefault();
    openModal(trigger.dataset.demoModal, trigger);
  });

  modal.addEventListener('click', function (event) {
    if (event.target.closest && event.target.closest('[data-demo-modal-close]')) closeModal();
  });

  modal.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(modal.querySelectorAll('button:not([disabled]), a[href]:not([hidden]), video[controls], [tabindex]:not([tabindex="-1"])')).filter((element) => !element.hidden && element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  renderFilters();
  renderProjects();
})();
