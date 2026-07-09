(function () {
  const root = document.getElementById("article-list-grid");
  const filterRoot = document.getElementById("article-filter-bar");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const articles = Array.isArray(window.ARTICLE_DATA) ? window.ARTICLE_DATA : [];

  if (!root || !filterRoot) return;

  const filters = ["All", "AI", "设计分享"];

  let activeFilter = "All";

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const escapeAttr = escapeHtml;

  const getVisibleArticles = () => {
    if (activeFilter === "All") return articles;
    return articles.filter(function (article) {
      return article.category === activeFilter;
    });
  };

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

  const revealEntries = () => {
    const entries = root.querySelectorAll(".portfolio-project");

    if (reduceMotion || !("IntersectionObserver" in window)) {
      entries.forEach(function (entry) {
        entry.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (items) {
        items.forEach(function (item) {
          if (!item.isIntersecting) return;
          item.target.classList.add("is-visible");
          observer.unobserve(item.target);
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    entries.forEach(function (entry) {
      observer.observe(entry);
    });
  };

  const renderArticles = () => {
    const visibleArticles = getVisibleArticles();

    if (visibleArticles.length === 0) {
      root.innerHTML = [
        '<div class="portfolio-empty-state">',
        "  <p>这个分类下的文章正在整理中。</p>",
        "</div>",
      ].join("\n");
      return;
    }

    root.innerHTML = visibleArticles
      .map(function (article, index) {
        const isReversed = index % 2 === 1;
        const number = String(index + 1).padStart(2, "0");

        const articleHref = article.blocks || article.content
          ? "./article-detail.html?slug=" + encodeURIComponent(article.slug)
          : "";
        const action = articleHref
          ? [
              '    <a class="article-status article-link" href="' + escapeAttr(articleHref) + '">',
              "      <span>阅读全文</span>",
              '      <span aria-hidden="true">↗</span>',
              "    </a>",
            ].join("\n")
          : '<span class="article-status">Coming soon</span>';

        return [
          '<article class="portfolio-project article-entry' + (isReversed ? " is-reversed" : "") + '" style="--item-delay: ' + index * 80 + 'ms">',
          '  <div class="article-index-card" aria-hidden="true">',
          '    <span class="article-index-number">' + number + "</span>",
          '    <span class="article-index-label">Article</span>',
          "  </div>",
          '  <div class="article-content">',
          '    <div class="article-meta">',
          '      <span class="article-category">' + escapeHtml(article.category) + "</span>",
          '      <span>' + escapeHtml(article.date) + "</span>",
          '      <span>' + escapeHtml(article.readTime) + "</span>",
          "    </div>",
          '    <h2 class="article-title">' + escapeHtml(article.title) + "</h2>",
          '    <p class="article-summary">' + escapeHtml(article.summary) + "</p>",
          action,
          "  </div>",
          "</article>",
        ].join("\n");
      })
      .join("\n");

    revealEntries();
  };

  filterRoot.addEventListener("click", function (event) {
    const button = event.target.closest ? event.target.closest("[data-filter]") : null;
    if (!button) return;

    activeFilter = button.dataset.filter || "All";
    renderFilters();
    renderArticles();
  });

  renderFilters();
  renderArticles();
})();
