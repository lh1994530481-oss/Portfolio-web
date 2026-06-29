const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pointerFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(edge0, edge1, value) {
  const x = clamp01((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function initHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  let lastY = window.scrollY;

  const onScroll = () => {
    const currentY = Math.max(window.scrollY, 0);
    const delta = currentY - lastY;

    if (currentY < 80) {
      header.classList.remove("is-hidden");
      lastY = currentY;
      return;
    }

    if (Math.abs(delta) >= 8) {
      header.classList.toggle("is-hidden", delta > 0);
      lastY = currentY;
    }
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
}

function initReveal() {
  const nodes = document.querySelectorAll("[data-reveal]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px",
    },
  );

  nodes.forEach((node) => observer.observe(node));
}

function initMagnetic() {
  if (reduceMotion || !pointerFine) return;

  const updateDock = (node, event, bound = 1.6, force = 14, scaleForce = 0.05) => {
    const rect = node.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = event.clientX - centerX;
    const deltaY = event.clientY - centerY;
    const distance = Math.hypot(deltaX, deltaY);
    const limit = Math.max(rect.width, rect.height) * bound;
    const proximity = Math.max(0, 1 - distance / limit);
    const moveX = (deltaX / rect.width) * force * proximity;
    const moveY = (deltaY / rect.height) * force * proximity;
    const scale = 1 + scaleForce * proximity;

    node.style.setProperty("--dock-x", moveX.toFixed(2) + "px");
    node.style.setProperty("--dock-y", moveY.toFixed(2) + "px");
    node.style.setProperty("--dock-scale", scale.toFixed(3));
  };

  const resetDock = (node) => {
    node.style.setProperty("--dock-x", "0px");
    node.style.setProperty("--dock-y", "0px");
    node.style.setProperty("--dock-scale", "1");
  };

  document.querySelectorAll(".magnetic").forEach((node) => {
    node.addEventListener("pointermove", (event) => updateDock(node, event));
    node.addEventListener("pointerleave", () => resetDock(node));
  });
}

function initProjectWall() {
  const grid = document.querySelector(".projects-grid");
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll(".project-card"));
  const resetGrid = () => {
    grid.classList.remove("is-hovering", "is-hovering-col-1", "is-hovering-col-2", "is-hovering-col-3");
  };

  if (!pointerFine || reduceMotion) {
    grid.addEventListener("pointerleave", resetGrid);
    return;
  }

  const activateColumn = (column) => {
    resetGrid();
    grid.classList.add("is-hovering", "is-hovering-col-" + column);
  };

  cards.forEach((card) => {
    const column = card.dataset.column;

    card.addEventListener("pointerenter", () => {
      if (column) activateColumn(column);
    });

    card.addEventListener("focusin", () => {
      if (column) activateColumn(column);
    });
  });

  grid.addEventListener("pointerleave", resetGrid);
  grid.addEventListener("focusout", (event) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && grid.contains(nextTarget)) return;
    resetGrid();
  });
}

function initScrollScene() {
  const root = document.documentElement;
  const heroCopy = document.querySelector(".hero-copy");
  const aboutCopy = document.querySelector(".about-copy");
  if (!heroCopy || !aboutCopy) return;

  const update = () => {
    const viewport = window.innerHeight || 1;
    const maxScroll = Math.max(document.documentElement.scrollHeight - viewport, 1);
    const scrollY = window.scrollY || 0;
    const progress = scrollY / viewport;
    const drift = smoothstep(0, 1.05, progress);
    const settle = smoothstep(1.08, 1.9, progress);
    const shiftX = lerp(0, window.innerWidth * 0.014, drift) - lerp(0, window.innerWidth * 0.022, settle);
    const shiftY = lerp(0, -window.innerHeight * 0.08, drift);
    const scale = lerp(1.02, 1.14, smoothstep(0, 1.5, progress));
    const heroOpacity = 1 - smoothstep(0.16, 0.56, progress);
    const aboutFadeIn = smoothstep(0.92, 1.12, progress);
    const aboutFadeOut = smoothstep(1.24, 1.62, progress);
    const aboutOpacity = clamp01(aboutFadeIn * (1 - aboutFadeOut));
    const radialOpacity = smoothstep(1.18, 1.78, progress) * 0.74;

    root.style.setProperty("--scene-x", shiftX.toFixed(2) + "px");
    root.style.setProperty("--scene-y", shiftY.toFixed(2) + "px");
    root.style.setProperty("--scene-scale", scale.toFixed(3));
    root.style.setProperty("--hero-opacity", heroOpacity.toFixed(3));
    root.style.setProperty("--about-opacity", aboutOpacity.toFixed(3));
    root.style.setProperty("--radial-mask-opacity", radialOpacity.toFixed(3));
    root.style.setProperty("--scroll-progress", String(Math.min(scrollY / maxScroll, 1)));
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

window.addEventListener("DOMContentLoaded", () => {
  initHeader();
  initReveal();
  initMagnetic();
  initProjectWall();
  initScrollScene();
});
