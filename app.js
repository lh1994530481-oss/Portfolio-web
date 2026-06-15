function initScrollEffects() {
  const body = document.body;
  const root = document.documentElement;

  const updateScrollState = () => {
    const maxScroll = Math.max(root.scrollHeight - window.innerHeight, 1);
    const progress = Math.min(window.scrollY / maxScroll, 1);
    root.style.setProperty("--scroll-progress", String(progress));
    body.classList.toggle("header-scrolled", window.scrollY > 24);
  };

  updateScrollState();
  window.addEventListener("scroll", updateScrollState, { passive: true });
  window.addEventListener("resize", updateScrollState);
}

function initRevealObserver() {
  const nodes = document.querySelectorAll('[data-reveal]:not([data-reveal="hero"])');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -10% 0px",
    },
  );

  nodes.forEach((node) => observer.observe(node));
}

function initDetailsBodies() {
  document.querySelectorAll("details").forEach((detail) => {
    const summary = detail.querySelector("summary");
    if (!summary || detail.querySelector(".detail-body")) {
      return;
    }

    const body = document.createElement("div");
    body.className = "detail-body";

    const inner = document.createElement("div");
    inner.className = "detail-body__inner";

    let sibling = summary.nextSibling;
    while (sibling) {
      const next = sibling.nextSibling;
      inner.appendChild(sibling);
      sibling = next;
    }

    body.appendChild(inner);
    detail.appendChild(body);
  });
}

function initHeroParallax() {
  const hero = document.querySelector(".hero");
  const cards = hero ? hero.querySelectorAll("[data-parallax]") : [];
  if (!hero || cards.length === 0) {
    return;
  }

  const moveCards = (event) => {
    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    cards.forEach((card, index) => {
      const depth = index === 0 ? 16 : 11;
      const rotate = index === 0 ? 4 : -4;
      const translateX = x * depth;
      const translateY = y * depth;
      const rotateY = x * rotate;
      const rotateX = y * rotate * -1;
      card.style.transform =
        "translate3d(" +
        translateX.toFixed(2) +
        "px, " +
        translateY.toFixed(2) +
        "px, 0) rotateX(" +
        rotateX.toFixed(2) +
        "deg) rotateY(" +
        rotateY.toFixed(2) +
        "deg)";
    });
  };

  const resetCards = () => {
    cards.forEach((card) => {
      card.style.transform = "";
    });
  };

  hero.addEventListener("pointermove", moveCards);
  hero.addEventListener("pointerleave", resetCards);
}

window.addEventListener("DOMContentLoaded", () => {
  initScrollEffects();
  initRevealObserver();
  initDetailsBodies();
  initHeroParallax();

  requestAnimationFrame(() => {
    document.body.classList.add("is-ready");
  });
});
