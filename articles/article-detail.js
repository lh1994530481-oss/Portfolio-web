(function () {
  const root = document.getElementById("article-detail-root");
  const articles = Array.isArray(window.ARTICLE_DATA) ? window.ARTICLE_DATA : [];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug") || "";
  const article = articles.find(function (item) {
    return item.slug === slug;
  }) || articles[0];

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  if (!article) {
    document.title = "Article Not Found | Lin Tong Xin";
    root.innerHTML = [
      '<section class="article-detail-shell">',
      '  <a class="portfolio-back article-detail-back" href="./index.html" data-transition-restore="true">Back</a>',
      '  <p class="article-detail-loading">文章暂时不可用。</p>',
      "</section>",
    ].join("\n");
    return;
  }

  document.title = article.title + " | Articles";

  const blocks = article.blocks || [];
  const sections = blocks.length
    ? blocks
        .map(function (block) {
          if (block.type === "heading") {
            return '<h2 class="article-detail-block-heading">' + escapeHtml(block.text) + "</h2>";
          }

          if (block.type === "image") {
            return [
              '<figure class="article-detail-image">',
              '  <img src="' + escapeHtml(block.src) + '" alt="' + escapeHtml(block.alt || article.title) + '" loading="lazy" decoding="async" />',
              "</figure>",
            ].join("\n");
          }

          return '<p class="article-detail-paragraph">' + escapeHtml(block.text) + "</p>";
        })
        .join("\n")
    : (article.content || [])
        .map(function (section) {
          return [
            '<section class="article-detail-section">',
            '  <h2>' + escapeHtml(section.heading) + "</h2>",
            (section.paragraphs || [])
              .map(function (paragraph) {
                return "  <p>" + escapeHtml(paragraph) + "</p>";
              })
              .join("\n"),
            "</section>",
          ].join("\n");
        })
        .join("\n");

  const sourceAction = article.sourceUrl
    ? [
        '<a class="article-detail-source" href="' + escapeHtml(article.sourceUrl) + '" target="_blank" rel="noopener noreferrer">',
        "  <span>阅读原文</span>",
        '  <span aria-hidden="true">↗</span>',
        "</a>",
      ].join("\n")
    : "";

  root.innerHTML = [
    '<header class="article-detail-header">',
    '  <a class="portfolio-back article-detail-back" href="./index.html" data-transition-restore="true">Back</a>',
    '  <a class="portfolio-brand" href="../index.html">Lin Tong Xin</a>',
    "</header>",
    '<article class="article-detail-shell">',
    '  <div class="article-detail-meta">',
    '    <span>' + escapeHtml(article.category) + "</span>",
    '    <span>' + escapeHtml(article.date) + "</span>",
    '    <span>' + escapeHtml(article.readTime) + "</span>",
    "  </div>",
    '  <h1 class="article-detail-title">' + escapeHtml(article.title) + "</h1>",
    '  <div class="article-detail-divider"></div>',
    sections,
    '  <footer class="article-detail-footer">',
    sourceAction,
    "  </footer>",
    "</article>",
    '<button class="article-scroll-top" type="button" aria-label="回到顶部">↑</button>',
  ].join("\n");

  const scrollTopButton = root.querySelector(".article-scroll-top");
  if (!scrollTopButton) return;

  const updateScrollTopButton = () => {
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const nearBottom = scrollY / maxScroll > 0.72;
    scrollTopButton.classList.toggle("is-visible", nearBottom);
  };

  scrollTopButton.addEventListener("click", function () {
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  });

  updateScrollTopButton();
  window.addEventListener("scroll", updateScrollTopButton, { passive: true });
})();
