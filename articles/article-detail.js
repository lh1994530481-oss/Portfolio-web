(async function () {
  const root = document.getElementById("article-detail-root");
  const fallbackArticles = Array.isArray(window.ARTICLE_DATA) ? window.ARTICLE_DATA : [];
  const articles = window.ContentAPI
    ? await window.ContentAPI.listArticles(fallbackArticles, false)
    : fallbackArticles;
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

  const resolveArticleImage = (value) => {
    const source = String(value || "").trim();
    const bundledImage = source.match(/(?:^|\/)(codex-figma-\d+\.(?:webp|png|gif))(?:[?#].*)?$/i);
    return bundledImage ? new URL("./assets/" + bundledImage[1], window.location.href).href : source;
  };

  const safeInlineHtml = (value) => {
    if (!value) return "";
    const documentValue = new DOMParser().parseFromString('<div id="inline">' + value + '</div>', "text/html");
    const rootNode = documentValue.getElementById("inline");
    const allowed = new Set(["B", "STRONG", "I", "EM", "U", "S", "A", "BR"]);
    Array.from(rootNode.querySelectorAll("*")).reverse().forEach(function (element) {
      if (!allowed.has(element.tagName)) {
        element.replaceWith.apply(element, Array.from(element.childNodes));
        return;
      }
      const href = element.tagName === "A" ? element.getAttribute("href") || "" : "";
      Array.from(element.attributes).forEach(function (attribute) { element.removeAttribute(attribute.name); });
      if (element.tagName === "A") {
        if (/^(https?:|mailto:|#)/i.test(href)) {
          element.setAttribute("href", href);
          element.setAttribute("rel", "noopener noreferrer");
        } else element.replaceWith.apply(element, Array.from(element.childNodes));
      }
    });
    return rootNode.innerHTML;
  };

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
  let headingIndex = 0;
  const sections = blocks.length
    ? blocks
        .map(function (block) {
          if (block.type === "heading") {
            headingIndex += 1;
            return '<h2 class="article-detail-block-heading" id="article-section-' + headingIndex + '">' + escapeHtml(block.text) + "</h2>";
          }

          if (block.type === "quote") return '<blockquote class="article-detail-quote">' + (safeInlineHtml(block.html) || escapeHtml(block.text)) + '</blockquote>';
          if (block.type === "code") return '<pre class="article-detail-code"><code>' + escapeHtml(block.text) + '</code></pre>';

          if (block.type === "image") {
            return [
              '<figure class="article-detail-image">',
              '  <img src="' + escapeHtml(resolveArticleImage(block.src)) + '" alt="' + escapeHtml(block.alt || article.title) + '" loading="lazy" decoding="async" />',
              "</figure>",
            ].join("\n");
          }

          return '<p class="article-detail-paragraph">' + (safeInlineHtml(block.html) || escapeHtml(block.text)) + "</p>";
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

  const headingBlocks = blocks.filter(function (block) { return block.type === "heading"; });
  const toc = headingBlocks.length ? [
    '<aside class="article-toc"><span>文章目录</span><nav>',
    headingBlocks.map(function (block, index) { return '<a href="#article-section-' + (index + 1) + '">' + escapeHtml(block.text) + '</a>'; }).join(""),
    '</nav></aside>',
  ].join("") : "";
  const related = articles.filter(function (item) { return item.slug !== article.slug; }).sort(function (left, right) {
    return Number(right.category === article.category) - Number(left.category === article.category);
  }).slice(0, 3);
  const relatedHtml = related.length ? [
    '<section class="article-related"><span>相关文章</span>',
    related.map(function (item) { return '<a href="./article-detail.html?slug=' + encodeURIComponent(item.slug) + '"><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.date || item.category) + '</small></a>'; }).join(""),
    '</section>',
  ].join("") : "";

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
    '  <div class="article-reading-layout">',
    toc,
    '  <div class="article-body">',
    sections,
    '  <footer class="article-detail-footer">',
    sourceAction,
    "  </footer>",
    relatedHtml,
    "  </div>",
    "  </div>",
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
