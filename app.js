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

function initAboutWords() {
  const aboutCopy = document.querySelector(".about-copy");
  if (!aboutCopy || aboutCopy.querySelector(".about-word")) return;

  const cjkRange = "\u3400-\u9fff\uf900-\ufaff";
  const text = aboutCopy.textContent
    .replace(/\s+/g, " ")
    .replace(new RegExp("([" + cjkRange + "])\\s+(?=[A-Za-z0-9])", "g"), "$1")
    .replace(new RegExp("([A-Za-z0-9/+.-])\\s+(?=[" + cjkRange + "])", "g"), "$1")
    .trim();
  if (!text) return;

  const fragment = document.createDocumentFragment();
  aboutCopy.setAttribute("aria-label", text);

  const segments = text.match(/[A-Za-z0-9]+(?:[/.+-][A-Za-z0-9]+)*|\s+|./g) || [];
  let wordIndex = 0;

  segments.forEach((segment) => {
    if (/^\s+$/.test(segment)) {
      fragment.appendChild(document.createTextNode(segment));
      return;
    }

    const span = document.createElement("span");
    span.className = "about-word";
    span.setAttribute("aria-hidden", "true");
    span.style.setProperty("--word-index", wordIndex);
    span.textContent = segment;
    fragment.appendChild(span);
    wordIndex += 1;
  });

  aboutCopy.replaceChildren(fragment);
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
  let lastFrameTime = 0;
  const current = {
    sceneX: 0,
    sceneY: 0,
    sceneScale: 1,
    heroOpacity: 1,
    radialOpacity: 0,
  };
  const target = { ...current, progress: 0 };

  const approach = (value, destination, amount, epsilon) => {
    if (Math.abs(destination - value) <= epsilon) return destination;
    return lerp(value, destination, amount);
  };

  const render = (timestamp) => {
    frameId = 0;
    const delta = lastFrameTime ? Math.min(timestamp - lastFrameTime, 32) : 16.67;
    const easing = reduceMotion ? 1 : 1 - Math.exp(-delta / 14);
    const verticalEasing = reduceMotion ? 1 : 1 - Math.exp(-delta / 10);
    const scaleEasing = reduceMotion ? 1 : 1 - Math.exp(-delta / 16);
    lastFrameTime = timestamp;

    current.sceneX = approach(current.sceneX, target.sceneX, easing, 0.12);
    current.sceneY = approach(current.sceneY, target.sceneY, verticalEasing, 0.12);
    current.sceneScale = approach(current.sceneScale, target.sceneScale, scaleEasing, 0.001);
    current.heroOpacity = approach(current.heroOpacity, target.heroOpacity, easing, 0.002);
    current.radialOpacity = approach(current.radialOpacity, target.radialOpacity, easing, 0.002);

    sceneShell.style.transform =
      "translate3d(" + current.sceneX.toFixed(2) + "px, " + current.sceneY.toFixed(2) +
      "px, 0) scale(" + current.sceneScale.toFixed(4) + ")";
    heroCopy.style.opacity = current.heroOpacity.toFixed(3);
    sceneRadial.style.opacity = current.radialOpacity.toFixed(3);

    if (Math.abs(target.progress - renderedProgress) > 0.0005) {
      renderedProgress = target.progress;
      progressBar.style.transform = "scaleX(" + renderedProgress.toFixed(4) + ")";
    }

    const unsettled =
      current.sceneX !== target.sceneX ||
      current.sceneY !== target.sceneY ||
      current.sceneScale !== target.sceneScale ||
      current.heroOpacity !== target.heroOpacity ||
      current.radialOpacity !== target.radialOpacity;

    if (unsettled) {
      frameId = window.requestAnimationFrame(render);
    } else {
      lastFrameTime = 0;
    }
  };

  const updateTargets = () => {
    const maxScroll = Math.max(document.documentElement.scrollHeight - viewportHeight, 1);
    const scrollY = window.scrollY || 0;
    const progress = scrollY / viewportHeight;
    const aboutEnter = smoothstep(0.66, 0.82, progress);
    const projectRestore = smoothstep(1.3, 1.44, progress);
    const aboutPosition = clamp01(aboutEnter * (1 - projectRestore));
    const sideRatio = viewportWidth < 768 ? -0.12 : viewportWidth < 1024 ? -0.17 : -0.2;
    const verticalRatio = viewportWidth < 768 ? -0.06 : 0;
    const aboutScale = viewportWidth < 768 ? 1.48 : viewportWidth < 1024 ? 1.61 : 1.74;
    const mobile = viewportWidth < 768;
    const aboutFadeIn = smoothstep(mobile ? 0.62 : 0.82, mobile ? 0.76 : 0.98, progress);
    const aboutFadeOut = smoothstep(mobile ? 1.28 : 1.18, mobile ? 1.54 : 1.5, progress);
    const aboutVisible = aboutFadeIn > 0.02 && aboutFadeOut < 0.98;
    const aboutExiting = aboutFadeOut > 0.02 && aboutFadeOut < 0.98;

    target.sceneX = viewportWidth * sideRatio * aboutPosition;
    target.sceneY = viewportHeight * verticalRatio * aboutPosition;
    target.sceneScale = lerp(1, aboutScale, aboutPosition);
    target.heroOpacity = 1 - smoothstep(0.16, 0.56, progress);
    target.radialOpacity = smoothstep(1.66, 2.08, progress) * 0.42;
    target.progress = Math.min(scrollY / maxScroll, 1);

    aboutCopy.classList.toggle("is-visible", aboutVisible);
    aboutCopy.classList.toggle("is-exiting", aboutExiting);

    if (!frameId) {
      lastFrameTime = 0;
      frameId = window.requestAnimationFrame(render);
    }
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
  initAboutWords();
  initScrollScene();
});
