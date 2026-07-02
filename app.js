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
  let frameId = 0;

  const update = () => {
    frameId = 0;
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

  const onScroll = () => {
    if (frameId) return;
    frameId = window.requestAnimationFrame(update);
  };

  update();
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
  const sceneShell = document.querySelector(".scene-shell");
  const sceneRadial = document.querySelector(".scene-radial");
  const progressBar = document.querySelector(".scroll-progress");
  const heroCopy = document.querySelector(".hero-copy");
  const aboutCopy = document.querySelector(".about-copy");
  if (!sceneShell || !sceneRadial || !progressBar || !heroCopy || !aboutCopy) return;

  let frameId = 0;
  let viewportWidth = window.innerWidth || 1;
  let viewportHeight = window.innerHeight || 1;
  let renderedProgress = -1;
  const current = {
    sceneX: 0,
    heroOpacity: 1,
    aboutOpacity: 0,
    radialOpacity: 0,
  };
  const target = { ...current, progress: 0 };

  const approach = (value, destination, amount, epsilon) => {
    if (Math.abs(destination - value) <= epsilon) return destination;
    return lerp(value, destination, amount);
  };

  const render = () => {
    frameId = 0;
    const easing = reduceMotion ? 1 : 0.2;

    current.sceneX = approach(current.sceneX, target.sceneX, easing, 0.12);
    current.heroOpacity = approach(current.heroOpacity, target.heroOpacity, easing, 0.002);
    current.aboutOpacity = approach(current.aboutOpacity, target.aboutOpacity, easing, 0.002);
    current.radialOpacity = approach(current.radialOpacity, target.radialOpacity, easing, 0.002);

    sceneShell.style.transform = "translate3d(" + current.sceneX.toFixed(2) + "px, 0, 0) scale(1.02)";
    heroCopy.style.opacity = current.heroOpacity.toFixed(3);
    aboutCopy.style.opacity = current.aboutOpacity.toFixed(3);
    sceneRadial.style.opacity = current.radialOpacity.toFixed(3);

    if (Math.abs(target.progress - renderedProgress) > 0.0005) {
      renderedProgress = target.progress;
      progressBar.style.transform = "scaleX(" + renderedProgress.toFixed(4) + ")";
    }

    const unsettled =
      current.sceneX !== target.sceneX ||
      current.heroOpacity !== target.heroOpacity ||
      current.aboutOpacity !== target.aboutOpacity ||
      current.radialOpacity !== target.radialOpacity;

    if (unsettled) frameId = window.requestAnimationFrame(render);
  };

  const updateTargets = () => {
    const maxScroll = Math.max(document.documentElement.scrollHeight - viewportHeight, 1);
    const scrollY = window.scrollY || 0;
    const progress = scrollY / viewportHeight;
    const aboutEnter = smoothstep(0.58, 1.05, progress);
    const aboutExit = smoothstep(1.56, 2.08, progress);
    const aboutPosition = clamp01(aboutEnter * (1 - aboutExit));
    const sideRatio = viewportWidth < 768 ? -0.18 : viewportWidth < 1024 ? -0.21 : -0.24;
    const aboutFadeIn = smoothstep(0.92, 1.12, progress);
    const aboutFadeOut = smoothstep(1.24, 1.62, progress);

    target.sceneX = viewportWidth * sideRatio * aboutPosition;
    target.heroOpacity = 1 - smoothstep(0.16, 0.56, progress);
    target.aboutOpacity = clamp01(aboutFadeIn * (1 - aboutFadeOut));
    target.radialOpacity = smoothstep(1.18, 1.78, progress) * 0.74;
    target.progress = Math.min(scrollY / maxScroll, 1);

    if (!frameId) frameId = window.requestAnimationFrame(render);
  };

  const onResize = () => {
    viewportWidth = window.innerWidth || 1;
    viewportHeight = window.innerHeight || 1;
    updateTargets();
  };

  updateTargets();
  window.addEventListener("scroll", updateTargets, { passive: true });
  window.addEventListener("resize", onResize);
}

window.addEventListener("DOMContentLoaded", () => {
  initHeader();
  initReveal();
  initMagnetic();
  initProjectWall();
  initScrollScene();
});
